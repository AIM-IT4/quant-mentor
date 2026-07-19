const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';
const supabase = createClient(SUPABASE_URL, supabaseKey);

async function getProducts() {
    console.log("🔍 Fetching recommended products details...");

    // Names from user:
    // 1. "quant add projects" -> "Ultimate Industry Grade Quant Project Pack"
    // 2. "models and derivatives products" -> "Quant Models for each Asset Class Master Pack" and "Derivatives Products & Pricing Master Pack"
    // 3. "problems notes" -> "Quant Interview Problem Book" (and maybe "Common Mistakes in Quant Interviews" or generic)

    const targets = [
        'Ultimate Industry Grade Quant Project Pack',
        'Quant Models for each Asset Class Master Pack',
        'Derivatives Products & Pricing Master Pack',
        'Quant Interview Problem Book'
    ];

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price, cover_image_url');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log("\nMatching products in database:");
    const found = [];
    for (const target of targets) {
        const match = products.find(p => p.name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(p.name.toLowerCase()));
        if (match) {
            console.log(`- Found: "${match.name}"`);
            console.log(`  ID: ${match.id}`);
            console.log(`  Price: ₹${match.price}`);
            console.log(`  Cover: ${match.cover_image_url}`);
            found.push(match);
        } else {
            console.log(`- Not found: "${target}"`);
        }
    }
}

getProducts();
