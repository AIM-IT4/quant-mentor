
const { createClient } = require('@supabase/supabase-js');

// Service Role Key from audit-revenue.js
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteDuplicates() {
    console.log('🗑️ Deleting Duplicate/Invalid Transactions...');

    // IDs identified from find-duplicates.js as the "High Value" duplicates (likely original price logs)
    const idsToDelete = [
        'eaec3b2d-7132-494c-88e7-2433a8d24cab', // 449 GBP (Duplicate of 5 GBP payment)
        'd27bc10c-13f7-4cfa-99c3-1f8d461ab5a2', // 719 GBP (Duplicate of 9 GBP payment)
        'c7c011b2-e1b6-4927-a241-376501027e46'  // 1999 INR (Duplicate of 1799 INR payment - pay_SFbc6w8cNeg8vZ)
    ];

    console.log(`Targeting ${idsToDelete.length} rows for deletion.`);

    const { error } = await supabase
        .from('purchases')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error('❌ Error deleting rows:', error);
    } else {
        console.log('✅ Successfully deleted invalid duplicate rows.');
    }
}

deleteDuplicates();
