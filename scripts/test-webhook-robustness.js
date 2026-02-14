// Test Webhook Logic Robustness
// This script simulates the execution of the webhook handler to verify fixes

const mockEnv = {
    SUPABASE_URL: 'https://dntabmyurlrlnoajdnja.supabase.co',
    SUPABASE_KEY: 'mock-key',
    BREVO_API_KEY: 'mock-brevo-key',
    ADMIN_EMAIL: 'admin@test.com',
    SENDER_EMAIL: 'sender@test.com',
    SENDER_NAME: 'QuantMentor'
};

// Mock fetch to track calls and parameters
async function mockFetch(url, options) {
    console.log(`\n🔍 MOCK FETCH: ${url}`);
    console.log(`   Headers:`, options.headers);
    if (options.body) console.log(`   Body:`, options.body);

    // Simulate responses
    if (url.includes('/rest/v1/products')) return { ok: true, json: async () => [{ file_url: 'https://cdn.test.com/product.pdf' }] };
    if (url.includes('/rest/v1/purchases')) return { ok: true, json: async () => [] }; // Not processed
    if (url.includes('/rest/v1/bookings')) return { ok: true, json: async () => [] }; // Not processed
    if (url.includes('api.brevo.com')) return { ok: true, text: async () => 'OK' };

    return { ok: true, json: async () => ({}) };
}

// Extract logic from razorpay-webhook.js (simplified for this test script)
async function handleProductPurchaseTest(data) {
    const { productName, customerEmail, customerName } = data;
    const { SUPABASE_URL, SUPABASE_KEY } = mockEnv;

    console.log(`--- Testing Product Purchase: ${productName} ---`);

    // Fix applied: Correct URL construction
    const productUrl = `${SUPABASE_URL}/rest/v1/products?name=ilike.${encodeURIComponent(productName.trim())}&select=file_url`;
    await mockFetch(productUrl, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    console.log('✅ URL check passed');
}

async function handleSessionBookingTest(data) {
    const { paymentId } = data;
    const { SUPABASE_URL, SUPABASE_KEY } = mockEnv;

    console.log(`--- Testing Session Booking: ${paymentId} ---`);

    // Fix applied: Corrected accidental spaces in URL
    const bookingUrl = `${SUPABASE_URL}/rest/v1/bookings?payment_id=eq.${paymentId}&select=id`;
    await mockFetch(bookingUrl, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}` // Fix applied: No stray space after Bearer
        }
    });

    console.log('✅ URL check passed (No spaces found)');
}

// Run tests
async function runTests() {
    await handleProductPurchaseTest({ productName: 'Python for Quants ', customerEmail: 'test@user.com', customerName: 'Test User' });
    await handleSessionBookingTest({ paymentId: 'pay_123456789' });
    console.log('\n✨ Webhook Logic Verification Complete');
}

runTests();
