
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findDuplicates() {
    console.log('🔍 Finding Duplicate Payment IDs...');

    const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const map = {};
    purchases.forEach(p => {
        if (!p.payment_id) return;
        if (!map[p.payment_id]) map[p.payment_id] = [];
        map[p.payment_id].push(p);
    });

    Object.entries(map).forEach(([payId, items]) => {
        if (items.length > 1) {
            console.log(`\n⚠️ Duplicate Payment ID: ${payId}`);
            items.forEach(p => {
                console.log(`   ID: ${p.id} | Amount: ${p.amount} ${p.currency} | Product: ${p.product_name}`);
            });
        }
    });
}

findDuplicates();
