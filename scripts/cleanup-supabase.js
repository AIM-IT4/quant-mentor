const { createClient } = require('@supabase/supabase-js');

// Constants - Update these if they differ
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'YOUR_SERVICE_ROLE_KEY_OR_ANON_KEY'; // Anon key might work if fix_storage_policies.sql is run

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanup() {
    console.log('🔍 Starting Supabase Storage Cleanup...');

    // 1. Get all file URLs from the database
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('file_url, cover_image_url');

    if (productError) {
        console.error('❌ Error fetching products:', productError);
        return;
    }

    const activeFiles = new Set();
    products.forEach(p => {
        if (p.file_url) activeFiles.add(p.file_url.split('/').pop());
        if (p.cover_image_url) activeFiles.add(p.cover_image_url.split('/').pop());
    });

    console.log(`✅ Found ${activeFiles.size} active files referenced in the database.`);

    // 2. Process Buckets
    const buckets = ['resources', 'product-covers'];
    let totalOrphans = 0;
    let totalSizeSaved = 0;

    for (const bucket of buckets) {
        console.log(`\n📂 Analyzing bucket: ${bucket}...`);

        const { data: files, error: listError } = await supabase.storage.from(bucket).list();

        if (listError) {
            console.error(`❌ Error listing bucket ${bucket}:`, listError);
            continue;
        }

        const orphans = files.filter(f => !activeFiles.has(f.name) && f.name !== '.emptyFolderPlaceholder');

        if (orphans.length === 0) {
            console.log(`✨ No orphaned files found in ${bucket}.`);
            continue;
        }

        console.log(`⚠️ Found ${orphans.length} orphaned files in ${bucket}.`);

        for (const orphan of orphans) {
            const sizeMB = (orphan.metadata.size / (1024 * 1024)).toFixed(2);
            console.log(`   - [DELETE] ${orphan.name} (${sizeMB} MB)`);

            // Actually delete
            const { error: deleteError } = await supabase.storage.from(bucket).remove([orphan.name]);

            if (deleteError) {
                console.error(`     ❌ Failed to delete ${orphan.name}:`, deleteError);
            } else {
                totalOrphans++;
                totalSizeSaved += orphan.metadata.size;
            }
        }
    }

    const totalSavedMB = (totalSizeSaved / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Cleanup Complete!`);
    console.log(`📊 Deleted ${totalOrphans} orphaned files.`);
    console.log(`💾 Approximately ${totalSavedMB} MB of space reclaimed.`);
}

if (SUPABASE_KEY === 'YOUR_SERVICE_ROLE_KEY_OR_ANON_KEY') {
    console.error('❌ Please update SUPABASE_KEY in the script first.');
} else {
    cleanup();
}
