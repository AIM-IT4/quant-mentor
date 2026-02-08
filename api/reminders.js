// Vercel Serverless Function: Automatic Session Reminders
// Called by external cron service (cron-job.org) every 5 minutes

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    // Verify secret to prevent unauthorized calls
    const secret = req.query.secret || req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        return res.status(500).json({
            error: 'CRON_SECRET not configured in environment variables'
        });
    }

    if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Configuration from environment variables
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_NAME = process.env.SENDER_NAME || 'QuantMentor';

    if (!BREVO_API_KEY) {
        return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
    }

    const results = {
        timestamp: new Date().toISOString(),
        reminders24h: [],
        reminders10m: [],
        errors: []
    };

    try {
        // Fetch confirmed/upcoming bookings (status can be 'confirmed' or 'upcoming')
        const today = new Date().toISOString().split('T')[0];

        const supabaseResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/bookings?status=in.(confirmed,upcoming)&booking_date=gte.${today}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!supabaseResponse.ok) {
            throw new Error(`Supabase fetch failed: ${supabaseResponse.status}`);
        }

        const bookings = await supabaseResponse.json();

        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                ...results,
                message: 'No confirmed bookings found'
            });
        }

        const now = new Date();

        for (const booking of bookings) {
            try {
                // Parse session datetime - assuming IST timezone (+05:30)
                // Add IST offset to make it timezone-aware
                const sessionStart = new Date(`${booking.booking_date}T${booking.booking_time}+05:30`);
                const timeDiff = sessionStart - now; // milliseconds
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                const minutesDiff = timeDiff / (1000 * 60);

                // 24-Hour Reminder (23 to 25 hours before)
                if (hoursDiff >= 23 && hoursDiff <= 25 && !booking.reminder_24h_sent) {
                    await sendReminder(booking, '24h', {
                        SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY,
                        ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME
                    });
                    results.reminders24h.push(booking.email);
                }

                // 10-Minute Reminder (5 to 15 minutes before)
                else if (minutesDiff > 5 && minutesDiff <= 15 && !booking.reminder_10m_sent) {
                    await sendReminder(booking, '10m', {
                        SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY,
                        ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME
                    });
                    results.reminders10m.push(booking.email);
                }

                // 5-Minute Reminder (0 to 5 minutes before)
                else if (minutesDiff > 0 && minutesDiff <= 5 && !booking.reminder_5m_sent) {
                    await sendReminder(booking, '5m', {
                        SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY,
                        ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME
                    });
                    results.reminders5m = results.reminders5m || [];
                    results.reminders5m.push(booking.email);
                }

            } catch (bookingError) {
                results.errors.push({
                    bookingId: booking.id,
                    error: bookingError.message
                });
            }
        }

        return res.status(200).json({
            ...results,
            message: `Processed ${bookings.length} bookings`,
            sent24h: results.reminders24h.length,
            sent10m: results.reminders10m.length
        });

    } catch (error) {
        console.error('Reminder cron error:', error);
        return res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Helper function to send reminder email
async function sendReminder(booking, type, config) {
    const { SUPABASE_URL, SUPABASE_KEY, BREVO_API_KEY, ADMIN_EMAIL, SENDER_EMAIL, SENDER_NAME } = config;

    const meetLink = booking.meet_link || 'https://meet.google.com/hfp-npyq-qho';
    const userName = booking.name || 'Learner';

    let subject, htmlBody;

    if (type === '24h') {
        subject = `Reminder: Session Tomorrow - ${booking.service_name}`;
        htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6366f1;">📅 Session Reminder</h2>
                <p>Hi ${userName},</p>
                <p>This is a friendly reminder that you have a session scheduled for <strong>tomorrow</strong>.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📋 Session:</strong> ${booking.service_name}</p>
                    <p><strong>📅 Date:</strong> ${booking.booking_date}</p>
                    <p><strong>⏰ Time:</strong> ${booking.booking_time} IST</p>
                </div>
                <p>See you there! 🚀</p>
                <p style="color: #6b7280;">Best regards,<br>${SENDER_NAME}</p>
            </div>
        `;
    } else if (type === '10m') {
        subject = `Starting Soon: Your Session in 10 Minutes! ⏰`;
        htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">⏰ Your Session Starts Soon!</h2>
                <p>Hi ${userName},</p>
                <p>Your session starts in about <strong>10 minutes</strong>.</p>
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p><strong>📋 Session:</strong> ${booking.service_name}</p>
                    <p><strong>🔗 Join Here:</strong> <a href="${meetLink}" style="color: #10b981;">${meetLink}</a></p>
                </div>
                <a href="${meetLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Meeting Now</a>
                <p style="margin-top: 20px;">Please be ready with your questions.</p>
                <p style="color: #6b7280;">Best regards,<br>${SENDER_NAME}</p>
            </div>
        `;
    } else if (type === '5m') {
        subject = `🚨 STARTING NOW: Your Session in 5 Minutes!`;
        htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef2f2; border: 2px solid #ef4444;">
                <h2 style="color: #ef4444;">🚨 Your Session Starts in 5 Minutes!</h2>
                <p>Hi ${userName},</p>
                <p><strong>Please join the meeting immediately!</strong></p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>📋 Session:</strong> ${booking.service_name}</p>
                    <p><strong>🔗 Join Here:</strong> <a href="${meetLink}" style="color: #ef4444;">${meetLink}</a></p>
                </div>
                <a href="${meetLink}" style="display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">🚀 JOIN NOW</a>
                <p style="color: #6b7280;">Best regards,<br>${SENDER_NAME}</p>
            </div>
        `;
    }

    // Send email via Brevo
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email: booking.email, name: userName }],
            subject: subject,
            htmlContent: htmlBody
        })
    });

    if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Brevo email failed: ${errorText}`);
    }

    // Send admin notification
    await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email: ADMIN_EMAIL }],
            subject: `Admin Alert: ${type} Reminder Sent`,
            htmlContent: `<p>${type} Reminder sent to ${booking.email} for ${booking.service_name}</p><p>Meeting Link: ${meetLink}</p>`
        })
    });

    // Update database to mark reminder as sent
    const updateField = type === '24h' ? 'reminder_24h_sent' : (type === '10m' ? 'reminder_10m_sent' : 'reminder_5m_sent');

    await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ [updateField]: true })
        }
    );

    console.log(`✅ ${type} reminder sent to ${booking.email}`);
}
