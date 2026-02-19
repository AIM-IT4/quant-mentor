
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COMMON_INR_PRICES = [449, 599, 719, 799, 1799, 1999, 7999, 1198, 1597];

async function currencyAudit() {
    console.log('🧐 Auditing for Mislabeled Currencies...');
    const { data: purchases } = await supabase.from('purchases').select('*');

    purchases.forEach(p => {
        if (p.currency !== 'INR' && (COMMON_INR_PRICES.includes(p.amount) || p.amount > 100)) {
            console.log(`⚠️ Potential Mislabel: ${p.amount} ${p.currency} (ID: ${p.payment_id}) | Product: ${p.product_name}`);
        }
    });
}

currencyAudit();
