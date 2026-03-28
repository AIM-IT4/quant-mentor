const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from('products').select('name, file_url');
    if (error) {
        console.error(error);
        return;
    }
    data.forEach(p => console.log(`${p.name} -> ${p.file_url}`));
}
check();
