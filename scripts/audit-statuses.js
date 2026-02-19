
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditStatuses() {
    console.log('📊 Auditing Statuses for Revenue Inclusion...');

    // 1. Bookings Statuses
    const { data: bookings } = await supabase.from('bookings').select('status, service_price');
    const bStats = {};
    bookings.forEach(b => {
        const s = b.status || 'null';
        if (!bStats[s]) bStats[s] = { count: 0, revenue: 0 };
        bStats[s].count++;
        bStats[s].revenue += (b.service_price || 0);
    });

    console.log('\n--- BOOKINGS STATUSES ---');
    Object.entries(bStats).forEach(([s, data]) => {
        console.log(`   - ${s.padEnd(25)}: ${data.count} rows | ₹${data.revenue.toLocaleString()}`);
    });

    // 2. Purchases Statuses (if any - purchases usually don't have a 'status' but let's check)
    // Actually our 'purchases' table might not have status. Let's check columns.
    // In audit-revenue.js I removed status because it didn't exist.

    const { data: allPurchases } = await supabase.from('purchases').select('*');
    console.log(`\n--- PURCHASES COUNT ---: ${allPurchases.length}`);

    // Check for "Total Volume" vs "Net"
    // I already did this.

    console.log('\n--- TARGET RECONCILIATION ---');
    const includedRevenue = (bStats['confirmed']?.revenue || 0) + (bStats['completed']?.revenue || 0) + (bStats['upcoming']?.revenue || 0);
    const potentialRevenue = includedRevenue + (bStats['admin_reschedule_pending']?.revenue || 0) + (bStats['reschedule_proposed']?.revenue || 0);

    console.log(`Current Included Booking Revenue: ₹${includedRevenue.toLocaleString()}`);
    console.log(`Potential + Pending Booking Revenue: ₹${potentialRevenue.toLocaleString()}`);
}

auditStatuses();
