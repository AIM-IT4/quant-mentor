
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectCurrencies() {
    console.log('Using database URL:', SUPABASE_URL);

    const { data, error } = await supabase
        .from('purchases')
        .select('currency');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const unique = [...new Set(data.map(d => (d.currency || 'NULL').toUpperCase()))];
    console.log('Distinct Currencies:', unique);
}

inspectCurrencies();
