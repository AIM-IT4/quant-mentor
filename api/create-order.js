// Create Cashfree Order (POST) / Verify Cashfree Payment (GET)
// POST /api/create-order - { amount, currency, notes } -> { order_id, payment_session_id, amount, currency }
// GET  /api/create-order?order_id=xxx - verify payment status

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

// Verify payment status by calling Cashfree Orders API
async function verifyOrder(orderId, res) {
    try {
        console.log('🔍 Verifying order:', orderId);

        const response = await fetch(`${CASHFREE_API_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to verify order:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to verify order',
                details: errorText
            });
        }

        const order = await response.json();
        console.log('✅ Order status:', order.order_status, '| order_id:', order.order_id);

        const isPaid = order.order_status === 'PAID';

        let paymentId = null;
        if (order.payments && order.payments.length > 0) {
            const successfulPayment = order.payments.find(p => p.payment_status === 'SUCCESS');
            if (successfulPayment) {
                paymentId = successfulPayment.payment_id;
            }
        }

        if (isPaid && !paymentId) {
            try {
                const paymentsRes = await fetch(`${CASHFREE_API_URL}/orders/${orderId}/payments`, {
                    method: 'GET',
                    headers: {
                        'x-client-id': CASHFREE_APP_ID,
                        'x-client-secret': CASHFREE_SECRET_KEY,
                        'x-api-version': API_VERSION,
                        'Accept': 'application/json'
                    }
                });

                if (paymentsRes.ok) {
                    const paymentsData = await paymentsRes.json();
                    const payments = paymentsData.payments || [];
                    const successPayment = payments.find(p => p.payment_status === 'SUCCESS');
                    if (successPayment) {
                        paymentId = successPayment.payment_id;
                    }
                }
            } catch (err) {
                console.warn('Could not fetch payments for order:', err);
            }
        }

        return res.status(200).json({
            status: isPaid ? 'success' : (order.order_status === 'ACTIVE' ? 'pending' : 'failed'),
            order_status: order.order_status,
            order_id: order.order_id,
            cf_order_id: order.cf_order_id,
            payment_id: paymentId,
            amount: order.order_amount,
            currency: order.order_currency,
            payment_time: order.payment_time || null,
            payment_method: order.payment_mode || null,
            customer_details: order.customer_details || null,
            order_tags: order.order_tags || {}
        });

    } catch (error) {
        console.error('❌ Error verifying order:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Create a new Cashfree order
async function createOrder(req, res) {
    try {
        const { amount, currency = 'INR', notes = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const orderId = 'CF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

        const customerName = notes.customer_name || notes.name || 'Customer';
        const customerEmail = notes.customer_email || notes.email || '';
        const customerPhone = notes.customer_phone || notes.phone || '';

        const orderTags = { ...notes };
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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        console.error('❌ CASHFREE_APP_ID or CASHFREE_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Payment gateway not configured on server' });
    }

    if (req.method === 'GET') {
        const { order_id } = req.query;
        if (!order_id) {
            return res.status(400).json({ error: 'order_id is required' });
        }
        return await verifyOrder(order_id, res);
    }

    if (req.method === 'POST') {
        return await createOrder(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
