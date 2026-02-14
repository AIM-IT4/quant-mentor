// Razorpay Webhook Handler
// This endpoint is called by Razorpay when payment events occur
// Handles product purchases and session bookings

import crypto from 'crypto';

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

    // Verify webhook signature
    if (RAZORPAY_WEBHOOK_SECRET) {
        const signature = req.headers['x-razorpay-signature'];
        // Use raw body if possible, otherwise stringify (Vercel provides parsed req.body)
        const bodyStr = (typeof req.body === 'string') ? req.body : JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(bodyStr)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.warn('Signature mismatch with direct stringify. Trying alternative formatting...');
            // Try stringify without spaces (common in some middleware/webhook senders)
            const alternateBodyStr = JSON.stringify(req.body);
            const altSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(alternateBodyStr).digest('hex');

            if (signature !== altSignature) {
                console.error('CRITICAL: Webhook signature verification failed for all formats');
                console.log('Received signature:', signature);
                console.log('Expected signature (direct):', expectedSignature);
                console.log('Expected signature (alt):', altSignature);
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
    }

    const event = req.body;
    console.log('Razorpay webhook received:', event.event);

    try {
        // Handle payment.captured event (successful payment)
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const paymentId = payment.id;
            const amount = payment.amount / 100; // Convert from paise to rupees
            const currency = payment.currency;
            const customerEmail = payment.email;
            const customerName = payment.notes?.customer_name || 'Customer';
            const customerPhone = payment.notes?.customer_phone || '';
            const productName = payment.notes?.product_name;
            const productType = payment.notes?.type || 'product'; // 'product' or 'session'

            console.log('Payment captured:', { paymentId, amount, customerEmail, productName, productType });

            if (productType === 'product' && productName) {
                // Handle product purchase
                await handleProductPurchase({
                    paymentId,
                    amount,
                    currency,
                    customerEmail,
                    customerName,
                    customerPhone,
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
        paymentId, amount, currency, customerEmail, customerName, customerPhone, productName,
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
                source: 'webhook'
            })
        });
        console.log('Purchase logged to Supabase');
    } catch (err) {
        console.error('Error logging to Supabase:', err);
    }

    // Send customer email
    if (BREVO_API_KEY && customerEmail) {
        const customerHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎉 Thank you for your purchase!</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p>Hi <strong>${customerName}</strong>,</p>
                <p>Thank you for purchasing our resources. Here are your details:</p>
                <p><strong>📦 Product:</strong> ${productName}</p>
                <p><strong>💰 Amount:</strong> ${currency} ${amount}</p>
                <p><strong>🆔 Payment ID:</strong> ${paymentId}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>📥 Download your product:</strong></p>
                <a href="${downloadLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Download Now</a>
                <p style="margin-top: 20px; color: #6b7280;">If you have any questions, simply reply to this email.</p>
                <p style="color: #6b7280;">Best regards,<br>${SENDER_NAME}</p>
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
                    htmlContent: customerHtml
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
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px;">
                <h2 style="color: #16a34a;">💰 New Sale: ${productName}</h2>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
                <hr>
                <p><strong>Amount:</strong> ${currency} ${amount}</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Source:</strong> Webhook Fulfillment</p>
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
                source: 'webhook' // Mark for debugging
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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎉 Your session has been booked!</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p>Hi <strong>${customerName}</strong>,</p>
                <p>Your session is confirmed. Here are the details:</p>
                <p><strong>📋 Session:</strong> ${sessionName} (${sessionDuration} mins)</p>
                <p><strong>📅 Date:</strong> ${sessionDate}</p>
                <p><strong>⏰ Time:</strong> ${sessionTime}</p>
                <p><strong>💰 Amount Paid:</strong> ₹${sessionPrice}</p>
                <p><strong>🆔 Payment ID:</strong> ${paymentId}</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p><strong>🔗 JOIN YOUR SESSION HERE:</strong></p>
                <a href="${meetLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Join Meeting</a>
                <p style="margin-top: 20px;"><strong>🔄 Need to Reschedule?</strong></p>
                <p>You can view and manage your bookings on our website.</p>
                <p style="margin-top: 20px; color: #6b7280;">Best regards,<br>${SENDER_NAME}</p>
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
                    htmlContent: customerHtml
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
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #4f46e5; border-radius: 8px;">
                <h2 style="color: #4f46e5;">🆕 New Session Booking (Webhook)</h2>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <hr>
                <p><strong>Session:</strong> ${sessionName}</p>
                <p><strong>Price:</strong> ₹${sessionPrice}</p>
                <p><strong>Date:</strong> ${sessionDate} at ${sessionTime}</p>
                <p><strong>Payment ID:</strong> ${paymentId}</p>
                <p><strong>Message:</strong> ${customerMessage}</p>
                <hr>
                <p><strong>🔗 Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">Processed via Server-side Webhook (Reliable Flow)</p>
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
