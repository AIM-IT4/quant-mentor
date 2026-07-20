const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
    path.join(__dirname, '..', 'index.html'),
    path.join(__dirname, '..', 'index-test.html'),
    path.join(__dirname, '..', 'quant-mentor', 'index.html'),
    path.join(__dirname, '..', 'quant-mentor', 'index-test.html')
];

function verifyFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const ldJsonRegex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    let foundMatchedBlock = false;
    let hasErrors = false;

    while ((match = ldJsonRegex.exec(content)) !== null) {
        try {
            const data = JSON.parse(match[1].trim());
            if (data && data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
                foundMatchedBlock = true;
                console.log(`\n🔍 Verifying ItemList schema in ${path.basename(filePath)} (${data.itemListElement.length} items)...`);

                data.itemListElement.forEach((listItem, idx) => {
                    const item = listItem.item;
                    if (!item) {
                        console.log(`   ❌ Item ${idx + 1}: Missing "item" object`);
                        hasErrors = true;
                        return;
                    }

                    if (item['@type'] !== 'Product') {
                        console.log(`   ❌ Item ${idx + 1}: Typo or not a Product: ${item['@type']}`);
                        hasErrors = true;
                        return;
                    }

                    const name = item.name || `Unnamed (index ${idx + 1})`;

                    // Verify mandatory elements
                    if (!item.image) {
                        console.log(`   ❌ Product "${name}": Missing "image"`);
                        hasErrors = true;
                    }

                    if (!item.brand || item.brand.name !== 'Desk2Quant') {
                        console.log(`   ❌ Product "${name}": Missing or invalid "brand"`);
                        hasErrors = true;
                    }

                    // Verify offers fields
                    const offers = item.offers;
                    if (!offers) {
                        console.log(`   ❌ Product "${name}": Missing "offers"`);
                        hasErrors = true;
                    } else {
                        const offersList = Array.isArray(offers) ? offers : [offers];
                        offersList.forEach(offer => {
                            if (!offer.availability) {
                                console.log(`   ❌ Product "${name}": Offer missing "availability"`);
                                hasErrors = true;
                            }
                            if (!offer.priceValidUntil) {
                                console.log(`   ❌ Product "${name}": Offer missing "priceValidUntil"`);
                                hasErrors = true;
                            }
                            if (!offer.hasMerchantReturnPolicy) {
                                console.log(`   ❌ Product "${name}": Offer missing "hasMerchantReturnPolicy"`);
                                hasErrors = true;
                            }
                        });
                    }
                });
            }
        } catch (e) {
            // Unrelated JSON blocks are fine, ignore if they throw parser errors
        }
    }

    if (!foundMatchedBlock) {
        console.log(`❌ ItemList schema block not found in: ${path.basename(filePath)}`);
        return false;
    }

    if (hasErrors) {
        console.log(`❌ Validation failed with errors in: ${path.basename(filePath)}`);
        return false;
    } else {
        console.log(`✅ ${path.basename(filePath)} product schema is 100% valid!`);
        return true;
    }
}

function main() {
    let allValid = true;
    TARGET_FILES.forEach(file => {
        const isValid = verifyFile(file);
        if (!isValid) allValid = false;
    });

    if (allValid) {
        console.log('\n🎉 ALL TARGET FILES HAVE PERFECT PRODUCT SCHEMAS!');
        process.exit(0);
    } else {
        console.log('\n❌ SOME FILES HAVE SCHEMA ERRORS. Please fix.');
        process.exit(1);
    }
}

main();
