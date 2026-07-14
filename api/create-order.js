// Create Cashfree Order
// POST /api/create-order
// Body: { amount (major units), currency, notes }
// Returns: { order_id, payment_session_id, amount, currency }

const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const API_VERSION = '2025-01-01';

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND']);

function getSubunitMultiplier(currencyCode = 'INR') {
    return ZERO_DECIMAL_CURRENCIES.has(String(currencyCode).toUpperCase()) ? 1 : 100;
}

export default async function handler(req, res) {
    // CORS headers for frontend calls
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        console.error('❌ CASHFREE_APP_ID or CASHFREE_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Payment gateway not configured on server' });
    }

    try {
        const { amount, currency = 'INR', notes = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate a unique order ID for Cashfree
        const orderId = 'CF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

        // Build customer_details from notes
        const customerName = notes.customer_name || notes.name || 'Customer';
        const customerEmail = notes.customer_email || notes.email || '';
        const customerPhone = notes.customer_phone || notes.phone || '';

        // Build order_tags from notes (Cashfree's equivalent of Razorpay notes)
        const orderTags = { ...notes };
        // Remove fields that are explicitly mapped in Cashfree
        delete orderTags.customer_name;
        delete orderTags.customer_email;
        delete orderTags.customer_phone;

        const orderPayload = {
            order_id: orderId,
            order_amount: Number(amount),
            order_currency: currency.toUpperCase(),
            customer_details: {
                customer_id: 'cust_' + Date.now(),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || '9999999999'
            },
            order_meta: {
                return_url: 'https://quant-mentor.vercel.app/',
                notify_url: 'https://quant-mentor.vercel.app/api/cashfree-webhook'
            },
            order_tags: orderTags
        };

        console.log('📦 Creating Cashfree order:', { amount, currency, orderId });

        const response = await fetch(`${CASHFREE_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Cashfree order creation failed:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to create order',
                details: errorText
            });
        }

        const order = await response.json();
        console.log('✅ Cashfree order created:', order.order_id, '| payment_session_id:', order.payment_session_id);

        // Amount in smallest currency unit (paise) for frontend display
        const multiplier = getSubunitMultiplier(currency);
        const amountInSubunits = Math.round(amount * multiplier);

        return res.status(200).json({
            order_id: order.order_id,
            payment_session_id: order.payment_session_id,
            amount: amountInSubunits,
            order_amount: order.order_amount,
            currency: order.order_currency
        });

    } catch (error) {
        console.error('❌ Error creating Cashfree order:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
