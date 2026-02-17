const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// EDIT THIS MAPPING: 'Product Name Exactly as in DB' : 'New External URL'
const LINK_UPDATES = {
    'Complete Front Office & Risk Quant Professional Bundle (40+ high quality PDFs & 55 scripts)': 'https://drive.google.com/uc?export=download&id=1XrgmUHRy-QjCt5IOTWg1e0WTM_4_Kaid',
    'Ultimate Industry Grade Quant Project Pack (45 Projects)': 'https://drive.google.com/uc?export=download&id=1jktrsnX880xtd3RVBw0nwC18beSc-toz',
    'Quant Models for Each Asset Class Master Pack : IR, FX, CREDITS , EQUITY': 'https://drive.google.com/uc?export=download&id=1CvriZOEfqiGkSRiKwR33kC3ny1T2oQSs',
    'Quant Interview Problem Book (1000+)': 'https://drive.google.com/uc?export=download&id=1sp48XJi8VZt5ufw4o6pHgg_EwBA0nkVJ',
    'Derivatives Products & Pricing Master Pack (6 PDFs): IR, FX, Equity, Credit, Inflation & Commodities': 'https://drive.google.com/uc?export=download&id=1kf_Qln0AFRi_Z1zvzaRHMojmZ152tY0j'
};

async function updateLinks() {
    console.log('🚀 Updating Product Links to External Storage...\n');

    for (const [name, newUrl] of Object.entries(LINK_UPDATES)) {
        if (newUrl === 'PASTE_GOOGLE_DRIVE_URL_HERE') {
            console.log(`⏩ Skipping [${name}]: New URL not provided.`);
            continue;
        }

        const { data, error } = await supabase
            .from('products')
            .update({ file_url: newUrl })
            .eq('name', name);

        if (error) {
            console.error(`❌ Error updating [${name}]:`, error.message);
        } else {
            console.log(`✅ Successfully updated [${name}]`);
        }
    }

    console.log('\n✨ Link update process complete.');
}

updateLinks();
