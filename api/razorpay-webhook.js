// Razorpay Webhook Handler
// This endpoint is called by Razorpay when payment events occur
// Handles product purchases and session bookings

import crypto from 'crypto';

// Disable Vercel body parsing so we can read the raw stream for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to read the raw body from the request stream
async function getRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Configuration
    const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_NAME = process.env.SENDER_NAME || 'QuantMentor';

    // 1. Capture Raw Body for Signature Verification
    let rawBody;
    try {
        rawBody = await getRawBody(req);
    } catch (err) {
        console.error('Error reading raw body:', err);
        return res.status(500).json({ error: 'Could not read request body' });
    }

    // 2. Verify Webhook Signature
    if (RAZORPAY_WEBHOOK_SECRET) {
        const signature = req.headers['x-razorpay-signature'];

        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('CRITICAL: Webhook signature verification failed');
            console.log('Received signature:', signature);
            console.log('Expected signature (raw_match):', expectedSignature);
            console.log('Raw body preview (50 chars):', rawBody.toString('utf8').substring(0, 50));
            return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('✅ Signature verified successfully');
    }

    // 3. Parse JSON body for logic
    let event;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch (err) {
        console.error('Error parsing JSON body:', err);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    console.log('Razorpay webhook received:', event.event);

    try {
        // Handle payment.captured event (successful payment)
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const paymentId = payment.id;
            const currency = payment.currency;
            const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'PYG', 'UGX'];
            const amount = zeroDecimalCurrencies.includes(currency) ? payment.amount : payment.amount / 100;
            const customerEmail = payment.email;
            const customerName = payment.notes?.customer_name || 'Customer';
            const customerPhone = payment.notes?.customer_phone || '';
            const customerCountry = payment.notes?.customer_country || payment.notes?.country || 'Unknown';
            const inrAmount = payment.notes?.inr_amount ? parseFloat(payment.notes.inr_amount) : amount;
            const productName = payment.notes?.product_name;
            const productType = payment.notes?.type || 'product'; // 'product' or 'session'

            console.log('Payment captured:', { paymentId, amount, inrAmount, customerEmail, customerCountry, productName, productType });

            if (productType === 'product' && productName) {
                // Handle product purchase
                await handleProductPurchase({
                    paymentId,
                    amount,
                    inrAmount,
                    currency,
                    customerEmail,
                    customerName,
                    customerPhone,
                    customerCountry,
                    productName,
                    SUPABASE_URL,
                    SUPABASE_KEY,
                    BREVO_API_KEY,
                    ADMIN_EMAIL,
                    SENDER_EMAIL,
                    SENDER_NAME
                });
            } else if (productType === 'session') {
                // Handle session booking (Server-side fulfillment for reliability)
                await handleSessionBooking({
                    paymentId,
                    amount,
                    currency,
                    customerEmail,
                    notes: payment.notes,
                    SUPABASE_URL,
                    SUPABASE_KEY,
                    BREVO_API_KEY,
                    ADMIN_EMAIL,
                    SENDER_EMAIL,
                    SENDER_NAME
                });
            }

            return res.status(200).json({ status: 'success', paymentId });
        }

        // Handle other events
        return res.status(200).json({ status: 'acknowledged', event: event.event });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// Handle product purchase - send email and log to Supabase
async function handleProductPurchase(data) {
    const {
        paymentId, amount, inrAmount, currency, customerEmail, customerName, customerPhone, customerCountry, productName,
        SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY, ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME
    } = data;

    console.log(`📦 Processing product purchase: ${productName} for ${customerEmail}`);

    // Product download links (fallback list)
    const PRODUCT_DOWNLOAD_LINKS = {
        'Python for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
        'C++ for Quants': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
        'XVA Derivatives Primer': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
        'Quant Projects Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
        'Interview Bible': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing',
        'Complete Quant Bundle': 'https://drive.google.com/file/d/13DP6sF_II4LE9cwBRc6QZzeg9ngellmf/view?usp=sharing'
    };

    let downloadLink = PRODUCT_DOWNLOAD_LINKS[productName];

    // Try to get download link from Supabase
    try {
        const productResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/products?name=ilike.${encodeURIComponent(productName.trim())}&select=file_url`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (productResponse.ok) {
            const products = await productResponse.json();
            if (products && products.length > 0 && products[0].file_url) {
                downloadLink = products[0].file_url;
                console.log('✅ Found custom link in Supabase:', downloadLink);
            }
        }
    } catch (err) {
        console.warn('Error fetching product from Supabase, using fallback list:', err);
    }

    if (!downloadLink) {
        console.error('No download link found for product:', productName);
        downloadLink = '#';
    }

    // Check if already processed
    try {
        const existingResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/purchases?payment_id=eq.${paymentId}&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (existingResponse.ok) {
            const existing = await existingResponse.json();
            if (existing && existing.length > 0) {
                console.log('Payment already processed:', paymentId);
                return;
            }
        }
    } catch (err) {
        console.error('Error checking existing purchase:', err);
    }

    // Log to Supabase
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                customer_email: customerEmail,
                product_name: productName,
                amount: Math.round(amount),
                currency: currency || 'INR',
                payment_id: paymentId,
                source: 'webhook',
                customer_country: customerCountry,
                inr_amount: inrAmount
            })
        });
        console.log('Purchase logged to Supabase');
    } catch (err) {
        console.error('Error logging to Supabase:', err);
    }

    // Send customer email
    if (BREVO_API_KEY && customerEmail) {
        const customerHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f9f8f4; padding: 40px 20px; color: #1a1a1a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                        <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">QuantMentor</span>
                    </div>
                    <div style="padding: 30px;">
                        <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-right: 10px;">New Purchase</span>
                            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Confirmed</span>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 25px;">Hi <strong>${customerName}</strong>, thank you for purchasing from QuantMentor.</p>
                        
                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 0.5px;">Digital Product</p>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px;">${productName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold;">Amount</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right;">${currency} ${amount}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <center>
                            <a href="${downloadLink}" style="display: inline-block; background: #e95836; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; margin-bottom: 30px;">Download Resource</a>
                        </center>

                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Purchase Details</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 5px 0; color: #666; width: 30%;">Name</td><td style="padding: 5px 0; color: #1a1a1a;">${customerName}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Email</td><td style="padding: 5px 0; color: #1a1a1a;"><a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a></td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Phone</td><td style="padding: 5px 0; color: #1a1a1a;">${customerPhone || 'N/A'}</td></tr>
                            </table>
                        </div>

                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Order Details</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 5px 0; color: #666; width: 30%;">Payment ID</td><td style="padding: 5px 0; color: #1a1a1a;">${paymentId}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div style="background-color: #1a1a1a; padding: 25px 20px; text-align: center; color: #888; font-size: 12px;">
                        <p style="margin: 0 0 10px 0;">Sent by QuantMentor</p>
                        <p style="margin: 0;">Have an issue? Reply to this email.</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: customerEmail, name: customerName }],
                    subject: `Your Purchase: ${productName}`,
                    htmlContent: customerHtml,
                    textContent: `Hi ${customerName},\n\nThank you for your purchase!\n\nProduct: ${productName}\nAmount: ${currency} ${amount}\n\nPlease download your resource using this link:\n${downloadLink}\n\nPayment ID: ${paymentId}\n\nHave an issue? Reply to this email.\n\nSent by QuantMentor`
                })
            });

            if (emailResponse.ok) {
                console.log(`✅ Customer purchase email sent to ${customerEmail}`);
            } else {
                const errorData = await emailResponse.text();
                console.error(`❌ Brevo Error (Product Email): ${emailResponse.status} - ${errorData}`);
            }
        } catch (err) {
            console.error('Error sending customer email:', err);
        }
    }

    // Send admin notification
    if (BREVO_API_KEY) {
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f9f8f4; padding: 40px 20px; color: #1a1a1a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                        <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">QuantMentor Admin</span>
                    </div>
                    <div style="padding: 30px;">
                        <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">New Sale Received</span>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 25px;"><strong>${customerName}</strong> just purchased a digital product.</p>
                        
                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 0.5px;">Product Sold</p>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px;">${productName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold;">Amount Received</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; color: #16a34a;">${currency} ${amount}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Customer Details</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 5px 0; color: #666; width: 30%;">Name</td><td style="padding: 5px 0; color: #1a1a1a;">${customerName}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Email</td><td style="padding: 5px 0; color: #1a1a1a;"><a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a></td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Phone</td><td style="padding: 5px 0; color: #1a1a1a;">${customerPhone || 'Not provided'}</td></tr>
                                <tr><td style="padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px; color: #666;">Payment ID</td><td style="padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px; color: #1a1a1a;">${paymentId} (Webhook)</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const adminEmailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: ADMIN_EMAIL }],
                    subject: `💰 New Sale: ${productName}`,
                    htmlContent: adminHtml
                })
            });

            if (adminEmailResponse.ok) {
                console.log('✅ Admin notification sent via webhook');
            } else {
                const errorData = await adminEmailResponse.text();
                console.error(`❌ Brevo Error (Admin Product): ${adminEmailResponse.status} - ${errorData}`);
            }
        } catch (err) {
            console.error('Error sending admin notification:', err);
        }
    }
}

// Handle session booking - send email and log to Supabase
async function handleSessionBooking(data) {
    const {
        paymentId, amount, currency, customerEmail, notes,
        SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY, ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME
    } = data;

    const customerName = notes.customer_name || 'Customer';
    const sessionName = notes.session_name || 'Consultation Session';
    const sessionDate = notes.session_date || 'TBD';
    const sessionTime = notes.session_time || 'TBD';
    const sessionDuration = notes.session_duration || '60';
    const sessionPrice = notes.session_price || amount;
    const customerPhone = notes.customer_phone || '';
    const customerMessage = notes.customer_message || '';
    const meetLink = "https://meet.google.com/hfp-npyq-qho";

    let displayTime = sessionTime;
    if (displayTime !== 'TBD' && !displayTime.toLowerCase().match(/am|pm/)) {
        const parts = displayTime.split(':');
        if (parts.length >= 2) {
            let hour = parseInt(parts[0], 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            displayTime = `${hour}:${parts[1]} ${ampm}`;
        }
    }

    console.log('Processing session booking via webhook:', { paymentId, customerEmail, sessionName });

    // 1. Check if already processed (prevent duplicate bookings)
    try {
        const existingResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/bookings?payment_id=eq.${paymentId}&select=id`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (existingResponse.ok) {
            const existing = await existingResponse.json();
            if (existing && existing.length > 0) {
                console.log('Booking already processed:', paymentId);
                return; // Already processed
            }
        }
    } catch (err) {
        console.error('Error checking existing booking:', err);
    }

    // 2. Log to Supabase bookings table
    try {
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                email: customerEmail,
                name: customerName,
                phone: customerPhone,
                service_name: sessionName,
                service_price: Math.round(sessionPrice),
                service_duration: parseInt(sessionDuration),
                booking_date: sessionDate,
                booking_time: sessionTime,
                message: customerMessage,
                status: 'upcoming',
                payment_id: paymentId,
                meet_link: meetLink,
                source: 'webhook', // Mark for debugging
                customer_country: notes.customer_country || notes.country || 'Unknown'
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Supabase booking insert failed:', errorText);
        } else {
            console.log('✅ Booking logged to Supabase');
        }
    } catch (err) {
        console.error('Error logging booking to Supabase:', err);
    }

    // 3. Send confirmation email to customer via Brevo
    if (BREVO_API_KEY && customerEmail) {
        const customerHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f9f8f4; padding: 40px 20px; color: #1a1a1a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                        <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">QuantMentor</span>
                    </div>
                    <div style="padding: 30px;">
                        <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-right: 10px;">New Booking</span>
                            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Confirmed</span>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 25px;">Hi <strong>${customerName}</strong>, your session is confirmed.</p>
                        
                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 0.5px;">Session Details</p>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px;">${sessionName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; padding: 5px 0;">Date</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; padding: 5px 0;">${sessionDate}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; padding: 5px 0;">Time</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; padding: 5px 0;">${displayTime} (${sessionDuration} mins)</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px;">Amount Paid</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px;">₹${sessionPrice}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <center>
                            <a href="${meetLink}" style="display: inline-block; background: #e95836; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; margin-bottom: 30px;">Join Meeting</a>
                        </center>

                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Need to Reschedule?</p>
                            <p style="font-size: 14px; margin: 0; color: #1a1a1a;">You can view and manage your bookings on our website.</p>
                        </div>
                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Order Details</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 5px 0; color: #666; width: 30%;">Payment ID</td><td style="padding: 5px 0; color: #1a1a1a;">${paymentId}</td></tr>
                            </table>
                        </div>
                    </div>
                    <div style="background-color: #1a1a1a; padding: 25px 20px; text-align: center; color: #888; font-size: 12px;">
                        <p style="margin: 0 0 10px 0;">Sent by QuantMentor</p>
                        <p style="margin: 0;">Have an issue? Reply to this email.</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: customerEmail, name: customerName }],
                    subject: `Booking Confirmed: ${sessionName}`,
                    htmlContent: customerHtml,
                    textContent: `Hi ${customerName},\n\nYour session is confirmed!\n\nSession: ${sessionName}\nDate: ${sessionDate}\nTime: ${displayTime} (${sessionDuration} mins)\nAmount Paid: ₹${sessionPrice}\n\nJoin Meeting Link:\n${meetLink}\n\nPayment ID: ${paymentId}\n\nNeed to reschedule? You can view and manage your bookings on our website.\n\nHave an issue? Reply to this email.\n\nSent by QuantMentor`
                })
            });

            if (emailResponse.ok) {
                console.log(`✅ Customer booking email sent to ${customerEmail}`);
            } else {
                const errorData = await emailResponse.text();
                console.error(`❌ Brevo Error (Booking Email): ${emailResponse.status} - ${errorData}`);
            }
        } catch (err) {
            console.error('Error sending customer booking email:', err);
        }
    }

    // 4. Send admin notification email
    if (BREVO_API_KEY) {
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; background-color: #f9f8f4; padding: 40px 20px; color: #1a1a1a;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                        <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">QuantMentor Admin</span>
                    </div>
                    <div style="padding: 30px;">
                        <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">New Booking Received</span>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 25px;"><strong>${customerName}</strong> just booked a new session.</p>
                        
                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 10px 0; letter-spacing: 0.5px;">Session Booked</p>
                            <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px;">${sessionName}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; padding: 5px 0;">Date & Time</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; padding: 5px 0;">${sessionDate} at ${displayTime}</td>
                                </tr>
                                <tr>
                                    <td style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; padding: 5px 0;">Amount Received</td>
                                    <td style="font-size: 14px; font-weight: bold; text-align: right; color: #16a34a; padding: 5px 0;">₹${sessionPrice}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 15px 0 5px 0;">
                                        <a href="${meetLink}" style="color: #e95836; font-weight: bold; text-decoration: none; font-size: 14px;">🔗 Join Meeting</a>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f9f8f4; padding: 20px; border-radius: 6px;">
                            <p style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin: 0 0 15px 0; letter-spacing: 0.5px;">Customer Details</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 5px 0; color: #666; width: 30%;">Name</td><td style="padding: 5px 0; color: #1a1a1a;">${customerName}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Email</td><td style="padding: 5px 0; color: #1a1a1a;"><a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a></td></tr>
                                <tr><td style="padding: 5px 0; color: #666;">Phone</td><td style="padding: 5px 0; color: #1a1a1a;">${customerPhone || 'Not provided'}</td></tr>
                                <tr><td style="padding: 5px 0; color: #666; vertical-align: top;">Message</td><td style="padding: 5px 0; color: #1a1a1a;">${customerMessage || 'None'}</td></tr>
                                <tr><td style="padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px; color: #666;">Payment ID</td><td style="padding: 5px 0; border-top: 1px solid #e5e5e5; margin-top: 5px; color: #1a1a1a;">${paymentId}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            const adminEmailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: ADMIN_EMAIL }],
                    subject: `🆕 New Booking: ${customerName} - ${sessionName}`,
                    htmlContent: adminHtml
                })
            });

            if (adminEmailResponse.ok) {
                console.log('✅ Admin booking notification sent');
            } else {
                const errorData = await adminEmailResponse.text();
                console.error(`❌ Brevo Error (Admin Booking): ${adminEmailResponse.status} - ${errorData}`);
            }
        } catch (err) {
            console.error('Error sending admin booking notification:', err);
        }
    }
}
