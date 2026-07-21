// Grant Drive access after payment - fallback when webhook fails
// POST /api/grant-access  Body: { payment_id, email }
// Verifies payment with Razorpay, resolves product link, grants Drive reader permission.

import crypto from 'crypto';

function normalizeProductName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ');
}

function extractDriveFileId(url) {
    if (!url) return null;
    let match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];
    match = url.match(/\/file\/d\/([^/]+)/);
    if (match) return match[1];
    match = url.match(/\/drive\/folders\/([^/?]+)/);
    if (match) return match[1];
    match = url.match(/\/open\?id=([^&]+)/);
    if (match) return match[1];
    return null;
}

async function grantDrivePermission(clientEmail, privateKey, fileId, customerEmail) {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const base64Encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const tokenInput = `${base64Encode(header)}.${base64Encode(claimSet)}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.write(tokenInput);
    signer.end();

    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const signature = signer.sign(formattedKey, 'base64url');
    const jwt = `${tokenInput}.${signature}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    if (!tokenResponse.ok) {
        throw new Error(`Drive auth failed: ${await tokenResponse.text()}`);
    }
    const { access_token: token } = await tokenResponse.json();

    const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: customerEmail })
    });
    if (!permissionResponse.ok) {
        throw new Error(`Drive permission failed: ${await permissionResponse.text()}`);
    }
    return permissionResponse.json();
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    try {
        const { payment_id: paymentId, email } = req.body || {};
        if (!paymentId || !email || !String(email).includes('@')) {
            return res.status(400).json({ error: 'payment_id and valid email required' });
        }

        // 1. Verify payment is real and captured (server-side, cannot be spoofed)
        const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const payResp = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            headers: { Authorization: authHeader }
        });
        if (!payResp.ok) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const payment = await payResp.json();
        if (payment.status !== 'captured') {
            return res.status(402).json({ error: `Payment not captured (status: ${payment.status})` });
        }

        // Email must match the payment's email or the email recorded in notes —
        // prevents third parties with a payment_id from granting themselves access
        const knownEmails = [payment.email, payment.notes?.customer_email]
            .filter(Boolean).map(e => String(e).trim().toLowerCase());
        if (knownEmails.length && !knownEmails.includes(String(email).trim().toLowerCase())) {
            return res.status(403).json({ error: 'Email does not match payment record' });
        }

        // 2. Resolve product name + link from payment/order notes
        let productName = payment.notes?.product_name;
        let downloadLink = payment.notes?.download_link || '';
        if ((!productName || !downloadLink) && payment.order_id) {
            const orderResp = await fetch(`https://api.razorpay.com/v1/orders/${payment.order_id}`, {
                headers: { Authorization: authHeader }
            });
            if (orderResp.ok) {
                const order = await orderResp.json();
                productName = productName || order.notes?.product_name;
                downloadLink = downloadLink || order.notes?.download_link || '';
            }
        }

        // 3. Fallback: look up link in Supabase products by name
        if (!downloadLink && productName && SUPABASE_KEY) {
            const prodResp = await fetch(`${SUPABASE_URL}/rest/v1/products?select=name,file_url`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            if (prodResp.ok) {
                const products = await prodResp.json();
                const norm = normalizeProductName(productName);
                const matched = Array.isArray(products)
                    ? products.find(p => normalizeProductName(p.name) === norm && p.file_url)
                    : null;
                if (matched) downloadLink = matched.file_url;
            }
        }

        if (!downloadLink) {
            return res.status(404).json({ error: 'No download link found for this purchase', product: productName || null });
        }

        // 4. Grant Drive permission if it's a Drive link
        const driveFileId = extractDriveFileId(downloadLink);
        let granted = false;
        let grantError = null;

        if (driveFileId && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
            try {
                await grantDrivePermission(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, driveFileId, email);
                granted = true;
                console.log(`✅ grant-access: shared ${driveFileId} with ${email} (payment ${paymentId})`);
            } catch (err) {
                grantError = err.message;
                console.error(`❌ grant-access: ${err.message}`);
            }
            const isFolder = downloadLink.includes('/folders/');
            downloadLink = isFolder
                ? `https://drive.google.com/drive/folders/${driveFileId}?usp=drivesdk`
                : `https://drive.google.com/file/d/${driveFileId}/view?usp=drivesdk`;
        }

        return res.status(200).json({
            success: true,
            product: productName || null,
            download_link: downloadLink,
            drive_access_granted: granted,
            drive_error: grantError
        });
    } catch (error) {
        console.error('grant-access error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
