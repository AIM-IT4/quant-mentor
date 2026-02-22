import https from 'https';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Cache for 5 minutes, serve stale for 10 min while revalidating
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dntabmyurlrlnoajdnja.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    if (!SUPABASE_KEY) {
        return res.status(500).json({ error: 'Missing SUPABASE_KEY environment variable' });
    }

    try {
        const products = await supabaseQuery(SUPABASE_URL, SUPABASE_KEY,
            '/rest/v1/products?select=id,name,description,price,category,cover_image_url,created_at&order=created_at.desc'
        );

        // Format for readability (strip HTML, clean up)
        const formatted = products.map(p => ({
            name: p.name,
            description: stripHtml(p.description),
            price: p.price === 0 ? 'Free' : `₹${p.price}`,
            priceINR: p.price,
            category: p.category || 'notes',
            coverImage: p.cover_image_url || null,
            purchaseUrl: p.price > 0 ? 'https://quant-mentor.vercel.app/#products' : 'https://quant-mentor.vercel.app/#resources',
            createdAt: p.created_at
        }));

        const paid = formatted.filter(p => p.priceINR > 0);
        const free = formatted.filter(p => p.priceINR === 0);

        return res.status(200).json({
            site: 'QuantMentor - quantmentor.in',
            description: 'Premium digital products for quantitative finance professionals. Curated study materials, coding scripts, and interview guides.',
            totalProducts: formatted.length,
            paidProducts: { count: paid.length, items: paid },
            freeResources: { count: free.length, items: free },
            allProducts: formatted
        });

    } catch (error) {
        console.error('Products API Error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch products' });
    }
}

function supabaseQuery(baseUrl, apiKey, path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(new Error('Invalid JSON from Supabase')); }
                } else {
                    reject(new Error(`Supabase ${res.statusCode}: ${data.substring(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

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
