const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COMMON_BUCKETS = [
    'resources', 'product-covers', 'blog-covers', 'blog-images', 'avatars',
    'images', 'uploads', 'files', 'assets', 'backups', 'temp', 'videos',
    'public', 'private', 'documents', 'media', 'submissions'
];

async function probeBuckets() {
    console.log('🕵️ Probing for common bucket names...');

    for (const bucket of COMMON_BUCKETS) {
        try {
            const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
            if (error) {
                // If it exists but we can't read it, it might still report a specific error
                if (error.message.includes('not found')) {
                    // Bucket definitely doesn't exist
                } else {
                    console.log(`   ❓ ${bucket}: Exists but restricted? (${error.message})`);
                }
            } else {
                console.log(`   ✅ ${bucket}: Found and accessible!`);
            }
        } catch (e) {
            // Ignore
        }
    }
    console.log('Done.');
}

probeBuckets();
