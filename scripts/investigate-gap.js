
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeToINR(amount, currency) {
    const rates = {
        'INR': 1,
        'USD': 83,
        'GBP': 105,
        'EUR': 90,
        'CAD': 61,
        'BRL': 16,
        'NGN': 0.05
    };
    return amount * (rates[currency] || 1);
}

async function investigateGap() {
    console.log('🔍 Investigating Revenue Gap...');

    const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    const isGhost = (p) => (p.amount === 449 || p.amount === 719) && p.currency === 'GBP';

    let totalFiltered = 0;
    let totalUnfiltered = 0;

    console.log('\n--- ALL PURCHASES (UNFILTERED) ---');
    purchases.forEach(p => {
        const norm = normalizeToINR(p.amount, p.currency);
        totalUnfiltered += norm;

        if (isGhost(p)) {
            console.log(`👻 [GHOST] ${p.amount} ${p.currency} -> ₹${Math.round(norm).toLocaleString()} | ${p.product_name} | ${p.payment_id}`);
        } else {
            totalFiltered += norm;
            if (p.currency !== 'INR') {
                console.log(`✅ [FOREIGN] ${p.amount} ${p.currency} -> ₹${Math.round(norm).toLocaleString()} | ${p.product_name} | ${p.payment_id}`);
            }
        }
    });

    console.log('\n--- REVENUE SUMMARY ---');
    console.log(`💰 Unfiltered Total (with ghosts): ₹${Math.round(totalUnfiltered).toLocaleString()}`);
    console.log(`💰 Filtered Total (without ghosts): ₹${Math.round(totalFiltered).toLocaleString()}`);
    console.log(`❓ Razorpay Target: ~₹89,000`);
    console.log(`📌 GAP: ₹${Math.round(89000 - totalFiltered).toLocaleString()}`);
}

investigateGap();
