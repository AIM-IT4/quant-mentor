// Vercel Cron Endpoint: Send scheduled product recommendation emails
// Runs every 15 minutes via Vercel Cron
// Picks up pending recommendation_emails where send_at <= now, sends via Brevo

export const config = {
    // No body parsing needed (GET endpoint)
};

export default async function handler(req, res) {
    // Allow GET (cron) and POST (manual trigger)
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron secret (prevent unauthorized triggers)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Also allow query param for manual testing
        const querySecret = req.query?.secret;
        if (querySecret !== cronSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_NAME = process.env.SENDER_NAME || 'QuantMentor';

    if (!BREVO_API_KEY) {
        return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
    }

    const results = { processed: 0, sent: 0, errors: 0, skipped: 0 };

    try {
        // 1. Fetch pending recommendations where send_at <= now
        const pendingResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/recommendation_emails?sent=eq.false&send_at=lte.${new Date().toISOString()}&order=send_at.asc&limit=10`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!pendingResponse.ok) {
            const errText = await pendingResponse.text();
            console.error('Failed to fetch pending recommendations:', errText);
            return res.status(500).json({ error: 'Failed to fetch pending recommendations', detail: errText });
        }

        const pendingEmails = await pendingResponse.json();

        if (!pendingEmails || pendingEmails.length === 0) {
            return res.status(200).json({ message: 'No pending recommendations', ...results });
        }

        console.log(`📧 Found ${pendingEmails.length} pending recommendation(s)`);

        // 2. Fetch all available products (for recommendations)
        const productsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=id,name,description,price,cover_image_url&price=gt.0&order=price.desc`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        let allProducts = [];
        if (productsResponse.ok) {
            allProducts = await productsResponse.json();
        }

        // 3. Process each pending recommendation
        for (const rec of pendingEmails) {
            results.processed++;

            try {
                // Fetch customer's purchase history to exclude already-bought products
                const purchasesResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/purchases?customer_email=eq.${encodeURIComponent(rec.customer_email)}&select=product_name`,
                    {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`
                        }
                    }
                );

                let purchasedNames = [rec.purchased_product];
                if (purchasesResponse.ok) {
                    const purchases = await purchasesResponse.json();
                    purchasedNames = purchases.map(p => p.product_name?.toLowerCase().trim());
                }

                // Filter out already-purchased products
                const available = allProducts.filter(p =>
                    !purchasedNames.includes(p.name?.toLowerCase().trim())
                );

                if (available.length === 0) {
                    console.log(`⏭️ No products to recommend for ${rec.customer_email} — they may own everything`);
                    // Mark as sent so we don't keep retrying
                    await markAsSent(SUPABASE_URL, SUPABASE_KEY, rec.id);
                    results.skipped++;
                    continue;
                }

                // Pick up to 3 recommendations — prioritize bundles, then by price desc
                const bundles = available.filter(p => p.name?.toLowerCase().includes('bundle') || p.name?.toLowerCase().includes('pack'));
                const nonBundles = available.filter(p => !p.name?.toLowerCase().includes('bundle') && !p.name?.toLowerCase().includes('pack'));

                const recommendations = [];
                // Add 1 bundle first if available
                if (bundles.length > 0) recommendations.push(bundles[0]);
                // Fill remaining with non-bundle products
                for (const p of nonBundles) {
                    if (recommendations.length >= 3) break;
                    recommendations.push(p);
                }
                // If still < 3, add more bundles
                for (let i = 1; i < bundles.length && recommendations.length < 3; i++) {
                    recommendations.push(bundles[i]);
                }

                // Build recommendation email HTML
                const emailHtml = buildRecommendationEmail(rec.customer_name, rec.purchased_product, recommendations);
                const emailText = buildRecommendationText(rec.customer_name, rec.purchased_product, recommendations);

                // Send via Brevo
                const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                        to: [{ email: rec.customer_email, name: rec.customer_name }],
                        subject: `${rec.customer_name}, you might also like these quant resources`,
                        htmlContent: emailHtml,
                        textContent: emailText
                    })
                });

                if (emailResponse.ok) {
                    console.log(`✅ Recommendation email sent to ${rec.customer_email}`);
                    await markAsSent(SUPABASE_URL, SUPABASE_KEY, rec.id);
                    results.sent++;
                } else {
                    const errData = await emailResponse.text();
                    console.error(`❌ Brevo error for ${rec.customer_email}:`, errData);
                    results.errors++;
                }

            } catch (err) {
                console.error(`❌ Error processing recommendation for ${rec.customer_email}:`, err);
                results.errors++;
            }
        }

        return res.status(200).json({ message: 'Recommendations processed', ...results });

    } catch (error) {
        console.error('Cron endpoint error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// Mark a recommendation as sent
async function markAsSent(supabaseUrl, supabaseKey, id) {
    await fetch(
        `${supabaseUrl}/rest/v1/recommendation_emails?id=eq.${id}`,
        {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                sent: true,
                sent_at: new Date().toISOString()
            })
        }
    );
}

// Build the recommendation email HTML
function buildRecommendationEmail(customerName, purchasedProduct, recommendations) {
    const productCards = recommendations.map(p => {
        const desc = stripHtml(p.description || '').substring(0, 120);
        const coverImg = p.cover_image_url
            ? `<img src="${p.cover_image_url}" alt="${p.name}" style="width:100%; height:140px; object-fit:contain; border-radius:4px; margin-bottom:12px; background:#f9f8f4;">`
            : '';

        return `
            <div style="background:#ffffff; border:1px solid #e5e5e5; border-radius:8px; padding:20px; margin-bottom:16px;">
                ${coverImg}
                <h3 style="margin:0 0 8px 0; font-size:16px; color:#1a1a1a;">${p.name}</h3>
                <p style="margin:0 0 12px 0; font-size:13px; color:#666; line-height:1.5;">${desc}...</p>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:18px; font-weight:bold; color:#1a1a1a;">₹${p.price}</span>
                    <a href="https://quant-mentor.vercel.app/?id=${p.id}" style="display:inline-block; background:#6366f1; color:#ffffff; font-weight:600; text-decoration:none; padding:8px 20px; border-radius:6px; font-size:14px;">View Product</a>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="font-family: Arial, sans-serif; background-color: #f9f8f4; padding: 40px 20px; color: #1a1a1a;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                    <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">QuantMentor</span>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; margin-bottom: 8px;">Hi <strong>${customerName}</strong>,</p>
                    <p style="font-size: 15px; color: #444; margin-bottom: 25px; line-height: 1.6;">
                        Thank you for purchasing <strong>${purchasedProduct}</strong>! 
                        Based on your interest, here are a few more resources that complement your purchase perfectly:
                    </p>

                    ${productCards}

                    <div style="text-align:center; margin-top:25px;">
                        <a href="https://quant-mentor.vercel.app/#products" style="display:inline-block; background:#e95836; color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 30px; border-radius:6px; font-size:16px;">Browse All Products</a>
                    </div>

                    <p style="font-size: 13px; color: #999; margin-top: 30px; text-align: center; line-height: 1.5;">
                        You're receiving this because you recently purchased from QuantMentor.<br>
                        If you have any questions, simply reply to this email.
                    </p>
                </div>
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                    <p style="margin: 0;">Sent by QuantMentor • <a href="https://quant-mentor.vercel.app" style="color:#6366f1; text-decoration:none;">quant-mentor.vercel.app</a></p>
                </div>
            </div>
        </div>
    `;
}

// Build plain-text version
function buildRecommendationText(customerName, purchasedProduct, recommendations) {
    const productList = recommendations.map(p =>
        `• ${p.name} — ₹${p.price}\n  ${stripHtml(p.description || '').substring(0, 100)}...\n  View: https://quant-mentor.vercel.app/?id=${p.id}`
    ).join('\n\n');

    return `Hi ${customerName},

Thank you for purchasing "${purchasedProduct}"!

Based on your interest, here are a few more resources you might like:

${productList}

Browse all products: https://quant-mentor.vercel.app/#products

If you have any questions, simply reply to this email.

Sent by QuantMentor`;
}

// Strip HTML tags from description
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}
