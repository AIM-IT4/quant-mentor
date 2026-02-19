
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function emergencyCleanup() {
    console.log('🚨 EMERGENCY CLEANUP: Analyzing High Revenue...');

    // 1. Fetch all rows that are suspect (GBP high values)
    const { data: ghosts, error } = await supabase
        .from('purchases')
        .select('*')
        .in('amount', [449, 719])
        .eq('currency', 'GBP');

    if (error) { console.error(error); return; }

    console.log(`FOUND ${ghosts.length} GHOST ROWS (Should be 0):`);
    ghosts.forEach(g => console.log(`   [DELETE TARGET] Rate: ${g.amount} GBP | ID: ${g.id} | PayID: ${g.payment_id}`));

    if (ghosts.length > 0) {
        // DELETE THEM ALL
        const ids = ghosts.map(g => g.id);
        const { error: delError } = await supabase
            .from('purchases')
            .delete()
            .in('id', ids);

        if (!delError) console.log(`\n✅ SUCCESSFULLY DELETED ${ghosts.length} GHOST ROWS.`);
        else console.error('❌ Delete failed:', delError);
    } else {
        console.log('✅ No ghosts found (System clean?).');
    }

    // 2. Verify Real Rows exist
    const { data: real } = await supabase
        .from('purchases')
        .select('*')
        .in('amount', [5, 9])
        .eq('currency', 'GBP');

    console.log(`\nVerifying Real Rows (Should be >= 2):`);
    real.forEach(r => console.log(`   [KEEP] Rate: ${r.amount} GBP | ID: ${r.id} | PayID: ${r.payment_id}`));
}

emergencyCleanup();
