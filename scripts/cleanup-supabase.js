const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROBE_BUCKETS = [
    'resources', 'product-covers', 'blog-covers', 'blog-images', 'avatars',
    'images', 'uploads', 'files', 'assets', 'backups', 'temp', 'videos',
    'public', 'private', 'documents', 'media', 'submissions'
];

async function listFilesRecursive(bucket, path = '') {
    let allFiles = [];
    let limit = 100;
    let offset = 0;

    while (true) {
        const { data, error } = await supabase.storage.from(bucket).list(path, {
            limit,
            offset,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
            if (error.message.includes('not found')) return [];
            throw error;
        }
        if (!data || data.length === 0) break;

        for (const item of data) {
            if (item.id === null) {
                // It's a folder
                const subFiles = await listFilesRecursive(bucket, (path ? path + '/' : '') + item.name);
                allFiles = allFiles.concat(subFiles);
            } else {
                // It's a file
                allFiles.push({
                    ...item,
                    fullPath: (path ? path + '/' : '') + item.name
                });
            }
        }

        if (data.length < limit) break;
        offset += limit;
    }
    return allFiles;
}

async function cleanup() {
    console.log('� Starting Universal Deep Storage Scan...');

    // 1. Get database references
    const { data: products } = await supabase.from('products').select('file_url, cover_image_url');
    const { data: blogs } = await supabase.from('blogs').select('cover_image_url');

    const activeFiles = new Set();
    if (products) {
        products.forEach(p => {
            if (p.file_url) activeFiles.add(p.file_url.split('/').pop());
            if (p.cover_image_url) activeFiles.add(p.cover_image_url.split('/').pop());
        });
    }
    if (blogs) {
        blogs.forEach(b => {
            if (b.cover_image_url) activeFiles.add(b.cover_image_url.split('/').pop());
        });
    }

    console.log(`✅ Database references ${activeFiles.size} unique files.`);

    let totalOrphanSize = 0;
    let totalActiveSize = 0;
    let foundAnyBuckets = false;

    for (const bucket of PROBE_BUCKETS) {
        try {
            const files = await listFilesRecursive(bucket);
            if (files.length > 0) {
                foundAnyBuckets = true;
                console.log(`\n📦 Bucket [${bucket}] contains ${files.length} files:`);

                for (const file of files) {
                    const size = file.metadata.size || 0;
                    const isOrphan = !activeFiles.has(file.name);
                    const sizeMB = (size / 1024 / 1024).toFixed(2);

                    if (isOrphan) {
                        console.log(`   ⚠️ ORPHAN [DELETING]: ${file.fullPath} (${sizeMB} MB)`);
                        totalOrphanSize += size;
                        await supabase.storage.from(bucket).remove([file.fullPath]);
                    } else {
                        console.log(`   ✅ ACTIVE: ${file.fullPath} (${sizeMB} MB)`);
                        totalActiveSize += size;
                    }
                }
            }
        } catch (err) {
            // Silently skip buckets we can't access
        }
    }

    console.log(`\n📊 Final Results:`);
    console.log(`Total Active Storage:   ${(totalActiveSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Orphaned Deleted: ${(totalOrphanSize / 1024 / 1024).toFixed(2)} MB`);

    if (!foundAnyBuckets) {
        console.log('❌ No accessible storage buckets found. This might be due to permissions or the project being in a different state.');
    }
}

cleanup();
