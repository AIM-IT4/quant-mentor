const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const supabase = createClient(SUPABASE_URL, supabaseKey);

async function findCustomer() {
    console.log("🔍 Searching bookings for 'Vasudha'...");
    const { data: bookings, error: errBookings } = await supabase
        .from('bookings')
        .select('*')
        .or('name.ilike.%vasudha%,email.ilike.%vasudha%');

    if (errBookings) {
        console.error('Error querying bookings:', errBookings);
    } else {
        console.log(`Found ${bookings.length} bookings:`);
        bookings.forEach(b => console.log(`- Booking Name: ${b.name}, Email: ${b.email}, Status: ${b.status}, Date: ${b.date || b.booking_date || b.created_at}`));
    }

    console.log("\n🔍 Searching purchases for 'Vasudha'...");
    const { data: purchases, error: errPurchases } = await supabase
        .from('purchases')
        .select('*')
        .or('customer_email.ilike.%vasudha%');

    if (errPurchases) {
        console.error('Error querying purchases:', errPurchases);
    } else {
        console.log(`Found ${purchases.length} purchases:`);
        purchases.forEach(p => console.log(`- Purchase Product: ${p.product_name}, Email: ${p.customer_email}, Date: ${p.created_at}`));
    }
}

findCustomer();
