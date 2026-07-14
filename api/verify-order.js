// Verify Cashfree Payment Status
// GET /api/verify-order?order_id=xxx
// Returns: { status, payment_id, amount, currency, ... }

const CASHFREE_API_URL = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const API_VERSION = '2025-01-01';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { order_id } = req.query;

    if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        console.error('❌ CASHFREE_APP_ID or CASHFREE_SECRET_KEY not configured');
        return res.status(500).json({ error: 'Payment gateway not configured on server' });
    }

    try {
        console.log('🔍 Verifying order:', order_id);

        // Fetch order status from Cashfree
        const response = await fetch(`${CASHFREE_API_URL}/orders/${order_id}`, {
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

        // Determine if payment was successful
        const isPaid = order.order_status === 'PAID';

        let paymentId = null;
        if (order.payments && order.payments.length > 0) {
            const successfulPayment = order.payments.find(p => p.payment_status === 'SUCCESS');
            if (successfulPayment) {
                paymentId = successfulPayment.payment_id;
            }
        }

        // If order is PAID but no payments array, try fetching payments separately
        if (isPaid && !paymentId) {
            try {
                const paymentsRes = await fetch(`${CASHFREE_API_URL}/orders/${order_id}/payments`, {
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
