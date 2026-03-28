/**
 * Supabase Database Fix Script
 * Run this in the browser console on the QuantMentor website (where Supabase is already initialized)
 * 
 * Fixes:
 * 1. "Formulea" → "Formula" in product names
 * 2. Truncated description for "Quantitative Finance for Absolute Beginners"
 */

(async function () {
    if (!window.supabaseClient) {
        console.error('❌ Supabase not initialized. Open this on the QuantMentor website first.');
        return;
    }

    console.log('🔧 Starting Supabase product fixes...');

    // Fix 1: "Formulea" → "Formula" in product name
    try {
        const { data: formulaProducts, error: fetchErr } = await window.supabaseClient
            .from('products')
            .select('id, name')
            .ilike('name', '%Formulea%');

        if (fetchErr) {
            console.error('❌ Error searching for Formulea:', fetchErr);
        } else if (formulaProducts && formulaProducts.length > 0) {
            for (const p of formulaProducts) {
                const fixedName = p.name.replace(/Formulea/gi, 'Formula');
                const { error: updateErr } = await window.supabaseClient
                    .from('products')
                    .update({ name: fixedName })
                    .eq('id', p.id);

                if (updateErr) {
                    console.error(`❌ Failed to fix "${p.name}":`, updateErr);
                } else {
                    console.log(`✅ Fixed: "${p.name}" → "${fixedName}"`);
                }
            }
        } else {
            console.log('ℹ️ No products found with "Formulea" typo (may already be fixed).');
        }
    } catch (e) {
        console.error('❌ Formulea fix failed:', e);
    }

    // Fix 2: Truncated description for "Quantitative Finance for Absolute Beginners"
    try {
        const { data: beginnerProducts, error: fetchErr2 } = await window.supabaseClient
            .from('products')
            .select('id, name, description')
            .ilike('name', '%Absolute Beginner%');

        if (fetchErr2) {
            console.error('❌ Error searching for Beginners product:', fetchErr2);
        } else if (beginnerProducts && beginnerProducts.length > 0) {
            for (const p of beginnerProducts) {
                // Check if description looks truncated
                const desc = p.description || '';
                if (desc.includes('Coupon code') || desc.endsWith('…') || desc.length < 50) {
                    const fixedDesc = 'A comprehensive self-study guide for aspiring quants with no prior background in quantitative finance. Covers probability, statistics, stochastic calculus fundamentals, derivatives pricing basics, risk management essentials, and Python for finance — all explained from first principles with worked examples and exercises.';

                    const { error: updateErr } = await window.supabaseClient
                        .from('products')
                        .update({ description: fixedDesc })
                        .eq('id', p.id);

                    if (updateErr) {
                        console.error(`❌ Failed to fix description for "${p.name}":`, updateErr);
                    } else {
                        console.log(`✅ Fixed truncated description for: "${p.name}"`);
                    }
                } else {
                    console.log(`ℹ️ Description for "${p.name}" looks OK (${desc.length} chars). Skipping.`);
                }
            }
        } else {
            console.log('ℹ️ No "Absolute Beginners" product found.');
        }
    } catch (e) {
        console.error('❌ Beginners description fix failed:', e);
    }

    console.log('🔧 Supabase fixes complete! Refresh the page to see changes.');
})();
