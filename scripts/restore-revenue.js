
const { createClient } = require('@supabase/supabase-js');

// Service Role Key from audit-revenue.js
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function restoreRevenue() {
    console.log('🔄 Restoring High-Value Transactions & Cleaning Low-Value Bugs...');

    // 1. Restore the Real (High) Transactions
    const rowsToRestore = [
        {
            customer_email: 'hachemhamdi@gmail.com',
            product_name: 'Equity Models : Quant Interview Playbook',
            amount: 449,
            currency: 'GBP',
            payment_id: 'pay_SFc7k0746xVhfl',
            created_at: '2026-02-13T06:00:09.078795+00:00'
        },
        {
            customer_email: 'hachemhamdi@gmail.com',
            product_name: 'Quant Interview Problem Book (1000+)',
            amount: 719,
            currency: 'GBP',
            payment_id: 'pay_SFcJr13i2x97B5',
            created_at: '2026-02-13T06:11:37.70056+00:00'
        }
    ];

    const { error: insertError } = await supabase
        .from('purchases')
        .insert(rowsToRestore);

    if (insertError) console.error('❌ Insert Error:', insertError);
    else console.log(`✅ Restored ${rowsToRestore.length} high-value rows.`);

    // 2. Delete the Bug (Low) Transactions
    // These share the same payment_id but have suspiciously low amounts (5, 9)
    // Also removing the 1799 INR duplicate (keeping 1999)
    const idsToDelete = [
        '5d39abd7-d7ee-48a8-9c64-7839cf8aae87', // 5 GBP
        'a1c9c1d4-874b-4608-9ba2-e69156a75bb8', // 9 GBP
        '36a56142-ad22-4d13-a5f4-3d96a28875b2'  // 1799 INR (Duplicate of 1999)
    ];

    const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) console.error('❌ Delete Error:', deleteError);
    else console.log(`✅ Deleted ${idsToDelete.length} low-value ghost rows.`);
}

restoreRevenue();
