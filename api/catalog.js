const PUBLIC_PRODUCT_FIELDS = [
    'id', 'name', 'description', 'price', 'original_price', 'discount_percentage',
    'coupon_code', 'cover_image_url', 'enable_ppp', 'average_rating',
    'sales_count', 'created_at', 'preview_summary', 'preview_table_of_contents',
    'preview_target_audience', 'preview_prerequisites', 'preview_expected_outcomes',
    'preview_sample_images', 'preview_sample_text'
].join(',');

function publicProduct(product) {
    const result = { ...product };
    // Free resources are intentionally public. Paid fulfillment stays server-side.
    if (Number(product.price) === 0 && product.file_url) result.download_url = product.file_url;
    delete result.file_url;
    return result;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return res.status(503).json({ error: 'Catalog temporarily unavailable' });
    }

    const productId = String(req.query.id || '').trim();
    const query = new URLSearchParams({ select: `${PUBLIC_PRODUCT_FIELDS},file_url`, order: 'created_at.desc' });
    if (productId) query.set('id', `eq.${productId}`);

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/products?${query.toString()}`, {
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`
            }
        });
        if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
        const products = (await response.json()).map(publicProduct);
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json(productId ? { product: products[0] || null } : { products });
    } catch (error) {
        console.error('Catalog API failed:', error.message);
        return res.status(500).json({ error: 'Catalog temporarily unavailable' });
    }
}
