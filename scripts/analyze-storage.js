const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROBE_BUCKETS = ['resources', 'product-covers', 'blog-covers', 'blog-images', 'images', 'uploads', 'files'];

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
                const subFiles = await listFilesRecursive(bucket, (path ? path + '/' : '') + item.name);
                allFiles = allFiles.concat(subFiles);
            } else {
                allFiles.push({
                    ...item,
                    bucket,
                    fullPath: (path ? path + '/' : '') + item.name
                });
            }
        }

        if (data.length < limit) break;
        offset += limit;
    }
    return allFiles;
}

async function analyze() {
    console.log('🔍 Analyzing Supabase Storage for Egress Optimization...\n');
    let allFiles = [];

    for (const bucket of PROBE_BUCKETS) {
        try {
            const files = await listFilesRecursive(bucket);
            allFiles = allFiles.concat(files);
        } catch (err) { }
    }

    allFiles.sort((a, b) => (b.metadata.size || 0) - (a.metadata.size || 0));

    console.log('--- Top 20 Largest Files ---');
    console.log('SIZE (MB) | BUCKET | NAME');
    console.log('----------|--------|-----');

    allFiles.slice(0, 20).forEach(file => {
        const sizeMB = ((file.metadata.size || 0) / 1024 / 1024).toFixed(2).padStart(8);
        console.log(`${sizeMB} MB | ${file.bucket.padEnd(6)} | ${file.fullPath}`);
    });

    const totalSize = allFiles.reduce((acc, f) => acc + (f.metadata.size || 0), 0);
    console.log(`\nTotal Storage Used: ${(totalSize / 1024 / 1024).toFixed(2)} MB in ${allFiles.length} files.`);
}

analyze();
