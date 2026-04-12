// Single-Buyer Re-engagement Campaign
// Finds customers who bought exactly 1 product and sends them
// 3 similar product recommendations with exclusive 20% discount codes.
//
// Trigger modes:
//   dry_run:    GET /api/send-single-buyer-offers?secret=SECRET&dry_run=true
//   test:       GET /api/send-single-buyer-offers?secret=SECRET&test_email=someone@example.com
//   bulk send:  GET /api/send-single-buyer-offers?secret=SECRET

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Auth ────────────────────────────────────────────────────────────────
    const cronSecret = process.env.CRON_SECRET;
    const querySecret = req.query?.secret;
    if (cronSecret && querySecret !== cronSecret) {
        return res.status(401).json({ error: 'Unauthorized — add ?secret=YOUR_CRON_SECRET' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OhbTYIuMYgGgmKPQJ9W7RA_rhKyaad0';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.SENDER_EMAIL || 'jha.8@alumni.iitj.ac.in';
    const SENDER_NAME = process.env.SENDER_NAME || 'QuantMentor';

    const isDryRun = req.query?.dry_run === 'true';
    const testEmail = req.query?.test_email;

    if (!isDryRun && !BREVO_API_KEY) {
        return res.status(500).json({ error: 'BREVO_API_KEY not configured' });
    }

    // ── Coupon expiry: 7 days from now ──────────────────────────────────────
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiryStr = expiryDate.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const results = {
        mode: isDryRun ? 'dry_run' : (testEmail ? 'test' : 'bulk'),
        totalCustomers: 0,
        singleBuyerCount: 0,
        sent: 0,
        skipped: 0,
        errors: 0,
        couponExpiryDate: expiryStr,
        details: []
    };

    try {
        // ── 1. Fetch ALL purchases ──────────────────────────────────────────
        const purchasesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/purchases?select=customer_email,product_name&order=created_at.desc`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!purchasesResponse.ok) {
            return res.status(500).json({ error: 'Failed to fetch purchases', detail: await purchasesResponse.text() });
        }

        const allPurchases = await purchasesResponse.json();

        // ── 2. Group by customer email ──────────────────────────────────────
        const customerMap = {};
        for (const p of allPurchases) {
            const email = (p.customer_email || '').toLowerCase().trim();
            if (!email || !email.includes('@')) continue;
            if (!customerMap[email]) customerMap[email] = new Set();
            customerMap[email].add((p.product_name || '').toLowerCase().trim());
        }

        const allCustomers = Object.entries(customerMap);
        results.totalCustomers = allCustomers.length;

        // ── 3. Filter: only customers who bought EXACTLY 1 unique product ───
        const singleBuyers = allCustomers.filter(([, products]) => products.size === 1);
        results.singleBuyerCount = singleBuyers.length;
        console.log(`🎯 Found ${singleBuyers.length} single-product buyers out of ${allCustomers.length} total customers`);

        // ── 4. Fetch all paid products ──────────────────────────────────────
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

        // Exclude the Complete Bundle from recommendations
        const recommendableProducts = allProducts.filter(p => {
            const name = (p.name || '').toLowerCase();
            return !(name.includes('complete') && (name.includes('bundle') || name.includes('professional')));
        });

        console.log(`📦 ${recommendableProducts.length} recommendable products (bundle excluded)`);

        // ── 5. For each single-buyer, build recommendations & send ──────────
        for (const [email, purchasedSet] of singleBuyers) {
            try {
                const purchasedProductName = [...purchasedSet][0]; // The one product they bought

                // Find the full product object that matches
                const purchasedProduct = allProducts.find(p =>
                    (p.name || '').toLowerCase().trim() === purchasedProductName
                );

                const purchasedDisplayName = purchasedProduct?.name || purchasedProductName;

                // Get category of what they bought
                const purchasedCategory = getProductCategory(purchasedProductName);

                // Pick 3 similar products they haven't bought
                const recommendations = getRecommendations(
                    purchasedProductName,
                    purchasedCategory,
                    recommendableProducts,
                    purchasedSet
                );

                if (recommendations.length < 1) {
                    console.log(`⏭️ ${email}: no recommendations available, skipping`);
                    results.skipped++;
                    results.details.push({ email, purchasedProduct: purchasedDisplayName, status: 'skipped', reason: 'no recommendations' });
                    continue;
                }

                // Build recommendation details with 20% codes
                const recDetails = recommendations.map(p => ({
                    name: p.name,
                    price: p.price,
                    discountedPrice: Math.round(p.price * 0.8),
                    couponCode: getCouponCode20(p.name),
                    id: p.id,
                    coverImage: p.cover_image_url
                }));

                if (isDryRun) {
                    results.details.push({
                        email,
                        purchasedProduct: purchasedDisplayName,
                        purchasedCategory,
                        status: 'would_send',
                        recommendations: recDetails.map(r => ({
                            name: r.name,
                            originalPrice: `₹${r.price}`,
                            discountedPrice: `₹${r.discountedPrice}`,
                            couponCode: r.couponCode
                        }))
                    });
                    results.sent++;
                    continue;
                }

                // ── Test mode: skip if email doesn't match ──────────────────
                if (testEmail && email !== testEmail.toLowerCase().trim()) {
                    continue;
                }

                // Build & send the email
                const emailHtml = buildCampaignEmail(purchasedDisplayName, recDetails, expiryStr);
                const emailText = buildCampaignText(purchasedDisplayName, recDetails, expiryStr);

                const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                        to: [{ email }],
                        subject: `A quick recommendation based on your recent purchase`,
                        htmlContent: emailHtml,
                        textContent: emailText
                    })
                });

                if (emailResponse.ok) {
                    console.log(`✅ Sent to ${email} — purchased: ${purchasedDisplayName}, recommended: ${recDetails.map(r => r.name).join(', ')}`);
                    results.sent++;
                    results.details.push({
                        email,
                        purchasedProduct: purchasedDisplayName,
                        status: 'sent',
                        recommendations: recDetails.map(r => r.name)
                    });
                } else {
                    const errData = await emailResponse.text();
                    console.error(`❌ Failed for ${email}:`, errData);
                    results.errors++;
                    results.details.push({ email, status: 'error', error: errData });
                }

                // Rate-limit between sends
                await new Promise(resolve => setTimeout(resolve, 250));

            } catch (err) {
                console.error(`❌ Error for ${email}:`, err.message);
                results.errors++;
                results.details.push({ email, status: 'error', error: err.message });
            }
        }

        // If test mode, handle case where the test email wasn't a single-buyer
        if (testEmail && results.sent === 0 && results.errors === 0) {
            // Send a demo email with the first single-buyer's data, or generate a sample
            const sampleBuyer = singleBuyers[0];
            if (sampleBuyer) {
                const [, purchasedSet] = sampleBuyer;
                const purchasedProductName = [...purchasedSet][0];
                const purchasedProduct = allProducts.find(p =>
                    (p.name || '').toLowerCase().trim() === purchasedProductName
                );
                const purchasedDisplayName = purchasedProduct?.name || purchasedProductName;
                const purchasedCategory = getProductCategory(purchasedProductName);
                const recommendations = getRecommendations(
                    purchasedProductName,
                    purchasedCategory,
                    recommendableProducts,
                    purchasedSet
                );
                const recDetails = recommendations.map(p => ({
                    name: p.name,
                    price: p.price,
                    discountedPrice: Math.round(p.price * 0.8),
                    couponCode: getCouponCode20(p.name),
                    id: p.id,
                    coverImage: p.cover_image_url
                }));

                const emailHtml = buildCampaignEmail(purchasedDisplayName, recDetails, expiryStr);
                const emailText = buildCampaignText(purchasedDisplayName, recDetails, expiryStr);

                const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'api-key': BREVO_API_KEY,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                        to: [{ email: testEmail }],
                        subject: `A quick recommendation based on your recent purchase`,
                        htmlContent: emailHtml,
                        textContent: emailText
                    })
                });

                if (emailResponse.ok) {
                    results.sent = 1;
                    results.details.push({
                        email: testEmail,
                        status: 'test_sent',
                        note: `Test email sent using sample data from: ${purchasedDisplayName}`,
                        recommendations: recDetails.map(r => r.name)
                    });
                } else {
                    results.errors = 1;
                    results.details.push({ email: testEmail, status: 'error', error: await emailResponse.text() });
                }
            }
        }

        console.log(`📧 Campaign complete: mode=${results.mode}, sent=${results.sent}, skipped=${results.skipped}, errors=${results.errors}`);

        // ── Reminder about coupon codes ─────────────────────────────────────
        if (!isDryRun) {
            results.reminder = '⚠️ Make sure all 20% coupon codes (XXXX20) are configured in your checkout/Razorpay system before customers try to use them!';
        }

        return res.status(200).json(results);

    } catch (error) {
        console.error('Campaign error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CATEGORY MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const PRODUCT_CATEGORIES = {
    // Beginner / Foundations
    'quantitative finance for absolute beginners': 'foundations',
    'probability theory for quants': 'foundations',
    'linear algebra & differential equations for quants': 'foundations',

    // Derivatives & Pricing
    'derivatives products & pricing master pack': 'derivatives',
    'exotic options pricing guide': 'derivatives',
    'greeks,vols,ycurves,numerical meth./mc & xva guide': 'derivatives',
    'greek explainer lab': 'derivatives',

    // Asset-Class Models
    'quant models for each asset class master pack': 'models',
    'interest rate models': 'models',
    'fx models': 'models',
    'equity models': 'models',
    'credit models': 'models',

    // Interview Prep
    'common mistakes in quant interviews': 'interview',
    'quant interview problem book': 'interview',
    'mental math & market intuition for quants': 'interview',

    // Programming
    'python for quants': 'programming',
    'c++ for quants': 'programming',
    'sql for quant interviews': 'programming',
    'r for risk quants': 'programming',

    // Stochastic / Math
    'stochastic calculus for quants': 'stochastic',
    'the stochastic calculus visual lab': 'stochastic',

    // Risk & PnL
    'regulatory & risk frameworks for quants': 'risk',
    'pnl attribution & desk diagnostics for quants': 'risk',
    'statistics & econometrics for quants': 'risk',

    // Projects & Career
    'ultimate industry grade quant project pack': 'projects',
    'complete quant ats friendly resume': 'career',

    // Fixed Income
    'fixed income math & bond pricing': 'fixed_income',

    // Machine Learning
    'machine learning for quants': 'ml',
};

// Related category affinities (ordered by relevance)
const CATEGORY_AFFINITIES = {
    'foundations':   ['interview', 'stochastic', 'programming', 'foundations', 'models', 'derivatives'],
    'derivatives':   ['models', 'stochastic', 'risk', 'derivatives', 'interview', 'fixed_income'],
    'models':        ['derivatives', 'stochastic', 'risk', 'models', 'interview', 'fixed_income'],
    'interview':     ['foundations', 'programming', 'stochastic', 'interview', 'models', 'derivatives'],
    'programming':   ['interview', 'foundations', 'ml', 'programming', 'projects', 'risk'],
    'stochastic':    ['derivatives', 'models', 'foundations', 'stochastic', 'risk', 'interview'],
    'risk':          ['derivatives', 'models', 'fixed_income', 'risk', 'stochastic', 'interview'],
    'projects':      ['programming', 'interview', 'career', 'projects', 'foundations'],
    'career':        ['interview', 'projects', 'programming', 'career', 'foundations'],
    'fixed_income':  ['derivatives', 'models', 'risk', 'fixed_income', 'stochastic'],
    'ml':            ['programming', 'risk', 'interview', 'ml', 'stochastic'],
};

function getProductCategory(productNameLower) {
    for (const [key, category] of Object.entries(PRODUCT_CATEGORIES)) {
        if (productNameLower.includes(key) || key.includes(productNameLower)) {
            return category;
        }
    }
    // Fuzzy match: check if any significant words match
    const words = productNameLower.split(/\s+/).filter(w => w.length > 4);
    for (const [key, category] of Object.entries(PRODUCT_CATEGORIES)) {
        for (const word of words) {
            if (key.includes(word)) return category;
        }
    }
    return 'foundations'; // Default fallback
}

function getRecommendations(purchasedNameLower, purchasedCategory, recommendableProducts, purchasedSet) {
    const affinities = CATEGORY_AFFINITIES[purchasedCategory] || Object.keys(CATEGORY_AFFINITIES);
    const recommendations = [];
    const usedIds = new Set();

    // Go through affinity categories in order and pick products
    for (const targetCategory of affinities) {
        if (recommendations.length >= 3) break;

        const categoryProducts = recommendableProducts.filter(p => {
            const pName = (p.name || '').toLowerCase().trim();
            const pCategory = getProductCategory(pName);
            return pCategory === targetCategory &&
                   !purchasedSet.has(pName) &&
                   !usedIds.has(p.id);
        });

        // Sort by price descending (higher-value first)
        categoryProducts.sort((a, b) => (b.price || 0) - (a.price || 0));

        for (const p of categoryProducts) {
            if (recommendations.length >= 3) break;
            recommendations.push(p);
            usedIds.add(p.id);
        }
    }

    // If we still have fewer than 3, fill from remaining products
    if (recommendations.length < 3) {
        const remaining = recommendableProducts.filter(p => {
            const pName = (p.name || '').toLowerCase().trim();
            return !purchasedSet.has(pName) && !usedIds.has(p.id);
        });
        remaining.sort((a, b) => (b.price || 0) - (a.price || 0));
        for (const p of remaining) {
            if (recommendations.length >= 3) break;
            recommendations.push(p);
            usedIds.add(p.id);
        }
    }

    return recommendations.slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 20% COUPON CODE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

const COUPON_CODE_MAP = {
    'quantitative finance for absolute beginners': 'BEGINNER20',
    'common mistakes in quant interviews': 'MISTAKES20',
    'quant interview problem book': 'PROBLEMS20',
    'greek explainer lab': 'GLAB20',
    'quant models for each asset class master pack': 'MODELS20',
    'the stochastic calculus visual lab': 'STOCHLAB20',
    'complete quant ats friendly resume': 'RESUME20',
    'mental math & market intuition for quants': 'MENTALMATH20',
    'python for quants': 'PYTHON20',
    'derivatives products & pricing master pack': 'DERIVATIVE20',
    'statistics & econometrics for quants': 'STATS20',
    'pnl attribution & desk diagnostics for quants': 'PNL20',
    'equity models': 'EQUITIES20',
    'interest rate models': 'RATES20',
    'machine learning for quants': 'ML20',
    'stochastic calculus for quants': 'STOCHASTIC20',
    'linear algebra & differential equations for quants': 'LADE20',
    'ultimate industry grade quant project pack': 'PROJECT20',
    'greeks,vols,ycurves,numerical meth./mc & xva guide': 'DESK20',
    'credit models': 'CREDITS20',
    'sql for quant interviews': 'SQL20',
    'regulatory & risk frameworks for quants': 'RISK20',
    'probability theory for quants': 'PROBABILITY20',
    'fx models': 'FXD20',
    'c++ for quants': 'CPP20',
    'r for risk quants': 'R20',
    'fixed income math & bond pricing': 'FIXEDINCOME20',
    'exotic options pricing guide': 'EXOTICS20',
};

function getCouponCode20(productName) {
    const nameLower = (productName || '').toLowerCase().trim();
    for (const [key, code] of Object.entries(COUPON_CODE_MAP)) {
        if (nameLower.includes(key) || key.includes(nameLower)) {
            return code;
        }
    }
    // Fuzzy fallback
    const words = nameLower.split(/\s+/).filter(w => w.length > 4);
    for (const [key, code] of Object.entries(COUPON_CODE_MAP)) {
        for (const word of words) {
            if (key.includes(word)) return code;
        }
    }
    return 'QUANT20'; // Generic fallback
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════════

function buildCampaignEmail(purchasedProductName, recommendations, expiryStr) {
    const productCards = recommendations.map(rec => {
        const savings = rec.price - rec.discountedPrice;
        return `
            <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #f0f0f0;">
                <h3 style="margin:0 0 8px 0; font-size:16px; color:#1f2937; font-weight:600;">
                    <a href="https://quant-mentor.vercel.app/product.html?id=${rec.id}" style="color:#2563eb; text-decoration:none;">
                        ${escapeHtml(rec.name)}
                    </a>
                </h3>
                <p style="margin:0 0 8px 0; font-size:14px; color:#4b5563;">
                    Normally ₹${rec.price}. With your code, it's <strong>₹${rec.discountedPrice}</strong> (you save ₹${savings}).
                </p>
                <p style="margin:0; font-size:14px; color:#4b5563;">
                    Code to apply at checkout: <strong style="background-color:#fef3c7; padding:2px 8px; border-radius:4px; color:#92400e; font-family:monospace; font-size:15px;">${rec.couponCode}</strong>
                </p>
            </div>`;
    }).join('');

    return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#ffffff; padding:20px; font-size:16px; color:#374151; line-height:1.6;">
        <div style="max-width:600px; margin:0 auto;">
            
            <p>Hi,</p>
            
            <p>I noticed you recently picked up <strong>${escapeHtml(purchasedProductName)}</strong> — thank you for that! I really hope you are finding it valuable for your quant journey.</p>
            
            <p>I was looking over the resources that pair well with what you just started studying, and I've put together a shortlist of my other materials that I think would help you take the next step.</p>
            
            <p>As a thank you for your support, I've activated a special 20% savings on these specifically for you. You can use the codes below at checkout.</p>
            
            <div style="margin:30px 0; padding:20px; background-color:#fafafa; border:1px solid #eaeaea; border-radius:8px;">
                <h2 style="margin:0 0 20px 0; font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#6b7280;">Recommended for you</h2>
                ${productCards}
                <p style="margin:0; font-size:13px; color:#9ca3af; font-style:italic;">Note: These private codes are valid until ${expiryStr}.</p>
            </div>
            
            <p>If you have any questions about the material or need advice on what to study next, just reply to this email. I read every one.</p>
            
            <p>Best regards,<br>
            <strong>Amit Kumar Jha</strong><br>
            QuantMentor</p>

            <hr style="border:none; border-top:1px solid #f3f4f6; margin:40px 0 20px 0;">
            <p style="font-size:12px; color:#9ca3af; margin:0;">
                <a href="https://quant-mentor.vercel.app" style="color:#9ca3af; text-decoration:underline;">quant-mentor.vercel.app</a>
            </p>
        </div>
    </div>`;
}

function buildCampaignText(purchasedProductName, recommendations, expiryStr) {
    const recList = recommendations.map(r =>
        `• ${r.name}\n  Your private price: ₹${r.discountedPrice} (Normally ₹${r.price})\n  Use code: ${r.couponCode}\n  Link: https://quant-mentor.vercel.app/product.html?id=${r.id}`
    ).join('\n\n');

    return `Hi,

I noticed you recently picked up "${purchasedProductName}" — thank you for that!

As a thank you, I've activated a special 20% savings on a few other materials that pair perfectly with what you're studying.

Recommended for you:

${recList}

(These private codes are valid until ${expiryStr})

If you have any questions or need advice on what to study next, just reply to this email.

Best,
Amit Kumar Jha
QuantMentor
https://quant-mentor.vercel.app`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
