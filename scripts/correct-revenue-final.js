
const { createClient } = require('@supabase/supabase-js');

// Service Role Key from audit-revenue.js
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function correctRevenueFinal() {
    console.log('📉 Correcting Revenue to reflect Real Payments (deleting Ghost High-Values)...');

    // 1. Delete the "High Value" Ghosts (449 GBP, 719 GBP)
    // These are physically impossible products for this user.
    // We target by Payment ID and Amount to be safe.
    const ghosts = [
        { id: 'pay_SFc7k0746xVhfl', amount: 449 },
        { id: 'pay_SFcJr13i2x97B5', amount: 719 }
    ];

    for (const ghost of ghosts) {
        const { error } = await supabase
            .from('purchases')
            .delete()
            .eq('payment_id', ghost.id)
            .eq('amount', ghost.amount);

        if (error) console.error(`❌ Failed to delete ghost ${ghost.amount}:`, error);
        else console.log(`✅ Deleted ghost row for ${ghost.amount} GBP.`);
    }

    // 2. Restore the "Low Value" Real Payments (5 GBP, 9 GBP)
    // These were likely the actual paid amounts (discounted).
    const realRows = [
        {
            customer_email: 'hachemhamdi@gmail.com',
            product_name: 'Equity Models : Quant Interview Playbook',
            amount: 5,
            currency: 'GBP',
            payment_id: 'pay_SFc7k0746xVhfl',
            created_at: '2026-02-13T05:59:59.075792+00:00', // Using original timestamp from log
            // ID will be geo-generated
        },
        {
            customer_email: 'hachemhamdi@gmail.com',
            product_name: 'Quant Interview Problem Book (1000+)',
            amount: 9,
            currency: 'GBP',
            payment_id: 'pay_SFcJr13i2x97B5',
            created_at: '2026-02-13T06:11:28.557763+00:00'
        }
    ];

    // Check if they already exist to avoid duplicates
    for (const row of realRows) {
        const { data } = await supabase.from('purchases').select('id').eq('payment_id', row.payment_id).eq('amount', row.amount);
        if (data && data.length > 0) {
            console.log(`ℹ️ Real row ${row.amount} GBP already exists.`);
        } else {
            const { error } = await supabase.from('purchases').insert(row);
            if (error) console.error(`❌ Failed to restore real row ${row.amount}:`, error);
            else console.log(`✅ Restored real row ${row.amount} GBP.`);
        }
    }
}

correctRevenueFinal();
