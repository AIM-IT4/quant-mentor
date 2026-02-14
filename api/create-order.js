// Create Razorpay Order with Instant Capture
// POST /api/create-order
// Body: { amount (major units), currency, notes }
// Returns: { order_id, amount, currency }

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

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        console.error('❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not configured');
        return res.status(500).json({ error: 'Payment gateway not configured on server' });
    }

    try {
        const { amount, currency = 'INR', notes = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Convert amount to smallest currency unit (paise/cents)
        const multiplier = currency.toUpperCase() === 'JPY' ? 1 : 100;
        const amountInSubunits = Math.round(amount * multiplier);

        // Create order via Razorpay Orders API
        const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

        const orderPayload = {
            amount: amountInSubunits,
            currency: currency.toUpperCase(),
            payment_capture: 1, // ✅ INSTANT CAPTURE — payment is captured immediately on authorization
            notes: notes
        };

        console.log('📦 Creating Razorpay order:', { amount, currency, amountInSubunits });

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Razorpay order creation failed:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to create order',
                details: errorText
            });
        }

        const order = await response.json();
        console.log('✅ Razorpay order created:', order.id, '| payment_capture:', order.payment_capture);

        return res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
