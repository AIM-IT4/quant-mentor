const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabaseSize() {
    console.log('📊 Probing Database Table Sizes...');

    // Using a trick to get table sizes if permissions allow
    const tables = ['products', 'bookings', 'sessions', 'blogs', 'testimonials', 'purchases'];

    for (const table of tables) {
        try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`   - ${table}: Error or No Access (${error.message})`);
            } else {
                console.log(`   - ${table}: ${count} rows`);
            }
        } catch (e) {
            console.log(`   - ${table}: Failed to query`);
        }
    }
}

checkDatabaseSize();
