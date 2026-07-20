/**
 * Diagnostic Tool: verify-drive-links.js
 * 
 * Audits all Google Drive product download links (both statically defined in the webhook
 * and stored dynamically in the Supabase 'products' table).
 * Reports whether the Service Account has sufficient Editor (Writer) permissions to 
 * manage their share permissions, and displays a checklist of action items.
 * 
 * Run: node scripts/verify-drive-links.js
 */

const fs = require('fs');
const path = require('path');

// 1. Parse and load .env file into process.env
try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        throw new Error('.env file not found');
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const regex = /^([A-Z0-9_]+)\s*=\s*(.*)$/gm;
    let match;
    while ((match = regex.exec(envContent)) !== null) {
        let key = match[1];
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
    }
    console.log('✓ Successfully loaded environment variables from .env');
} catch (err) {
    console.error('✖ Error loading .env configuration:', err.message);
    process.exit(1);
}

// Fallbacks
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
    console.error('✖ GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY not set in .env');
    process.exit(1);
}

// Direct copy of static links from razorpay-webhook.js
const STATIC_LINKS = {
    'Quant Interview Problem Book (1000+ Problems with solutions)': 'https://drive.google.com/uc?export=download&id=1sp48XJi8VZt5ufw4o6pHgg_EwBA0nkVJ',
    'Quant Interview Problem Book (1000+)': 'https://drive.google.com/uc?export=download&id=1sp48XJi8VZt5ufw4o6pHgg_EwBA0nkVJ',
    'Quant Models for Each Asset Class Master Pack: IR, FX, Credits, Equity': 'https://drive.google.com/uc?export=download&id=1CvriZOEfqiGkSRiKwR33kC3ny1T2oQSs',
    'Quant Models for Each Asset Class Master Pack : IR, FX, CREDITS , EQUITY': 'https://drive.google.com/uc?export=download&id=1CvriZOEfqiGkSRiKwR33kC3ny1T2oQSs',
    'Derivatives Products & Pricing Master Pack (6 PDFs): IR, FX, Equity, Credit, Inflation & Commodities': 'https://drive.google.com/uc?export=download&id=1kf_Qln0AFRi_Z1zvzaRHMojmZ152tY0j',
    'Ultimate Industry Grade Quant Project Pack (45 Projects)': 'https://drive.google.com/uc?export=download&id=1jktrsnX880xtd3RVBw0nwC18beSc-toz',
    'Complete Front Office & Risk Quant Professional Bundle (40+ PDFs & 60+ scripts)': 'https://drive.google.com/uc?export=download&id=1XrgmUHRy-QjCt5IOTWg1e0WTM_4_Kaid',
    'Complete Front Office & Risk Quant Professional Bundle (40+ high quality PDFs & 55 scripts)': 'https://drive.google.com/uc?export=download&id=1XrgmUHRy-QjCt5IOTWg1e0WTM_4_Kaid',
    'Python for Quants: Complete Interview Guide': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Python for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'C++ for Quants: Desk-Ready Notes': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'C++ for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'XVA Derivatives Primer': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Quant Projects Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Interview Bible': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
    'Complete Quant Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing'
};

// Parse Drive ID
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

// Generate JWT token
const crypto = require('crypto');
async function getAccessToken() {
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

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!resp.ok) {
        throw new Error('Google token exchange failed: ' + await resp.text());
    }
    const data = await resp.json();
    return data.access_token;
}

// Audit single Google Drive ID
async function auditDriveId(token, fileId) {
    try {
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,capabilities,permissions(role,emailAddress)`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!resp.ok) {
            const err = await resp.json();
            return {
                ok: false,
                reason: err.error?.message || 'Access Forbidden (not shared)'
            };
        }

        const metadata = await resp.json();

        // Check if SA is Writer or Owner
        const saPermission = (metadata.permissions || []).find(p => p.emailAddress === clientEmail);
        const role = saPermission ? saPermission.role : 'none';
        const hasEditorAccess = role === 'writer' || role === 'owner' || (metadata.capabilities && metadata.capabilities.canEdit);

        return {
            ok: true,
            name: metadata.name,
            role: role,
            hasEditorAccess: !!hasEditorAccess
        };
    } catch (err) {
        return {
            ok: false,
            reason: err.message
        };
    }
}

async function audit() {
    try {
        console.log('\nGenerating Google access token...');
        const token = await getAccessToken();
        console.log('✓ Token generated.');

        // Initialize unique items map
        const auditList = {};

        // 1. Process static links
        for (const [name, url] of Object.entries(STATIC_LINKS)) {
            const fileId = extractDriveFileId(url);
            if (fileId) {
                auditList[fileId] = {
                    productName: name,
                    url: url,
                    source: 'Statically mapped in webhook config'
                };
            }
        }

        // 2. Fetch dynamic links from Supabase
        console.log('\nFetching products from Supabase...');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        const prodResp = await fetch(`${supabaseUrl}/rest/v1/products?select=name,file_url`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (prodResp.ok) {
            const dbProducts = await prodResp.json();
            console.log(`✓ Fetched ${dbProducts.length} products from Supabase.`);
            for (const prod of dbProducts) {
                const url = prod.file_url;
                const fileId = extractDriveFileId(url);
                if (fileId) {
                    if (auditList[fileId]) {
                        auditList[fileId].source += ' & Supabase DB';
                    } else {
                        auditList[fileId] = {
                            productName: prod.name,
                            url: url,
                            source: 'Supabase DB only'
                        };
                    }
                }
            }
        } else {
            console.warn('✖ Failed to fetch products from Supabase, relying on static configurations.');
        }

        console.log(`\nAuditing ${Object.keys(auditList).length} unique Google Drive IDs...\n`);
        console.log('--------------------------------------------------------------------------------');
        console.log(`%-40s %-20s %-25s`.replace(/%/g, ' '));
        console.log('Product Name / File ID                    Status               Details');
        console.log('--------------------------------------------------------------------------------');

        const actionRequired = [];

        for (const [fileId, info] of Object.entries(auditList)) {
            const result = await auditDriveId(token, fileId);
            const truncatedName = info.productName.substring(0, 36) + (info.productName.length > 36 ? '...' : '');

            if (result.ok) {
                if (result.hasEditorAccess) {
                    console.log(`✓ ${truncatedName.padEnd(38)} READY                (SA role: ${result.role})`);
                } else {
                    console.log(`⚠ ${truncatedName.padEnd(38)} NO EDITOR ACCESS     (SA role is: ${result.role})`);
                    actionRequired.push({ id: fileId, name: info.productName, reason: `Role is '${result.role}'. Needs Editor.` });
                }
            } else {
                console.log(`✖ ${truncatedName.padEnd(38)} NOT SHARED           (${result.reason})`);
                actionRequired.push({ id: fileId, name: info.productName, reason: result.reason });
            }
            console.log(`   └─ ID: ${fileId} (${info.source})`);
        }

        console.log('--------------------------------------------------------------------------------');

        if (actionRequired.length === 0) {
            console.log('\n✅ ALL PRODUCT LINKS ARE SECURE AND FULLY FUNCTIONAL!\n');
        } else {
            console.log(`\n⚠️ ACTION REQUIRED FOR ${actionRequired.length} PRODUCTS:`);
            console.log('To fix, share these items in Google Drive with:');
            console.log(`👉 drive-sharing-service@desk2quant.iam.gserviceaccount.com as EDITOR\n`);
            actionRequired.forEach((item, index) => {
                console.log(`${index + 1}. Product: "${item.name}"`);
                console.log(`   ID:      ${item.id}`);
                console.log(`   Status:  ${item.reason}\n`);
            });
        }

    } catch (err) {
        console.error('Audit Error:', err.message);
    }
}

audit();
