
const { createClient } = require('@supabase/supabase-js');

// Service Role Key from audit-revenue.js
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectHighValue() {
    console.log('🔍 Inspecting High Value Transactions...');

    const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .or('currency.eq.GBP,amount.gt.5000'); // Check GBP or high INR

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${purchases.length} high value items:`);
    purchases.forEach(p => {
        console.log(`\nID: ${p.id}`);
        console.log(`Email: ${p.customer_email}`);
        console.log(`Product: ${p.product_name}`);
        console.log(`Amount: ${p.amount} ${p.currency}`);
        console.log(`Payment ID: ${p.payment_id}`);
        console.log(`Created At: ${p.created_at}`);
    });
}

inspectHighValue();
