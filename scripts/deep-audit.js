
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeToINR(amount, currency) {
    const rates = {
        'INR': 1,
        'USD': 83,
        'GBP': 105,
        'EUR': 90,
        'CAD': 61,
        'BRL': 16,
        'NGN': 0.05
    };
    return amount * (rates[currency] || 1);
}

async function deepAudit() {
    console.log('🚀 DEEP AUDIT: Reconciling with Razorpay 89K...');

    const { data: purchases } = await supabase.from('purchases').select('*');
    const { data: bookings } = await supabase.from('bookings').select('*');

    // 1. Group by Payment ID
    const payMap = {};
    purchases.forEach(p => {
        if (!p.payment_id) return;
        if (!payMap[p.payment_id]) payMap[p.payment_id] = [];
        payMap[p.payment_id].push(p);
    });

    console.log('\n--- DUPLICATE PAYMENT ID ANALYSIS ---');
    Object.entries(payMap).forEach(([pid, items]) => {
        if (items.length > 1) {
            console.log(`⚠️ Multiple entries for ${pid}:`);
            items.forEach(i => console.log(`   - ${i.amount} ${i.currency} | ${i.id}`));
        }
    });

    // 2. Ghost Analysis - Are any ghosts the ONLY record for a payment?
    console.log('\n--- SOLITARY GHOST ANALYSIS ---');
    const isSuspectAmount = (amt) => (amt === 449 || amt === 719);
    Object.entries(payMap).forEach(([pid, items]) => {
        const hasGhost = items.some(i => isSuspectAmount(i.amount) && i.currency === 'GBP');
        const hasNormal = items.some(i => !isSuspectAmount(i.amount) || i.currency !== 'GBP');

        if (hasGhost && !hasNormal) {
            console.log(`🚨 SOLITARY GHOST: Payment ${pid} ONLY has high-value GBP entry!`);
        }
    });

    // 3. Currency Check
    const currencies = {};
    purchases.forEach(p => {
        currencies[p.currency] = (currencies[p.currency] || 0) + 1;
    });
    console.log('\n--- CURRENCIES FOUND ---');
    console.log(currencies);

    // 4. Final Totals
    const filteredPurchases = purchases.filter(p => !((p.amount === 449 || p.amount === 719) && p.currency === 'GBP'));
    const purchaseRev = filteredPurchases.reduce((sum, p) => sum + normalizeToINR(p.amount, p.currency), 0);
    const bookingRev = bookings
        .filter(b => ['confirmed', 'completed', 'upcoming', 'admin_reschedule_pending'].includes(b.status))
        .reduce((sum, b) => sum + (b.service_price || 0), 0);

    console.log('\n--- FINAL REVENUE STATE ---');
    console.log(`Purchase Revenue (Clean): ₹${Math.round(purchaseRev).toLocaleString()}`);
    console.log(`Booking Revenue (All Active): ₹${Math.round(bookingRev).toLocaleString()}`);
    console.log(`TOTAL SYSTEM REVENUE: ₹${Math.round(purchaseRev + bookingRev).toLocaleString()}`);
    console.log(`TARGET: ₹89,000`);
    console.log(`GAP: ₹${Math.round(89000 - (purchaseRev + bookingRev)).toLocaleString()}`);
}

deepAudit();
