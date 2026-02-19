
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXCHANGE_RATES = {
    'USD': 87,
    'EUR': 95,
    'GBP': 110,
    'BRL': 15,
    'INR': 1
};

function normalizeToINR(amount, currency) {
    if (!amount) return 0;
    const code = (currency || 'INR').toUpperCase();
    const rate = EXCHANGE_RATES[code] || 1;
    return amount * rate;
}

async function auditRevenue() {
    console.log('📊 Auditing Revenue...');

    // 1. Fetch Purchases (No status field)
    const { data: purchases, error: pError } = await supabase
        .from('purchases')
        .select('amount, currency, created_at, product_name'); // Removed status

    if (pError) console.error('Purchases Error:', pError);

    // 2. Fetch Bookings
    const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select('service_price, status, created_at, service_name');

    if (bError) console.error('Bookings Error:', bError);

    console.log(`\nFound ${purchases?.length || 0} purchases and ${bookings?.length || 0} bookings.`);

    let totalRaw = 0;
    let totalNorm = 0;

    console.log('\n--- PURCHASES (Sample) ---');
    (purchases || []).slice(0, 5).forEach(p => console.log(`${p.amount} ${p.currency} - ${p.product_name}`));

    // Sum Purchases
    (purchases || []).forEach(p => {
        // Log large transactions to check for outliers
        const norm = normalizeToINR(p.amount, p.currency);
        if (norm > 5000) console.log(`[High Value] ${p.amount} ${p.currency} -> ₹${norm}`);

        totalRaw += (p.amount || 0);
        totalNorm += norm;
    });

    // Sum Bookings
    console.log('\n--- BOOKINGS (Sample) ---');
    bookings.slice(0, 5).forEach(b => console.log(`${b.service_price} INR (${b.status})`));

    (bookings || []).forEach(b => {
        // Assume filtered in dashboard: 'confirmed', 'completed', 'upcoming'
        // Let's see if we are missing 'pending' or others
        totalNorm += (b.service_price || 0);
    });

    console.log(`\n💰 Total Calculated Revenue (Normalized INR): ₹${Math.round(totalNorm).toLocaleString()}`);
}

auditRevenue();
