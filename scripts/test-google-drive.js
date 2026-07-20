const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load user credentials
const keyPath = 'C:\\Users\\iitak\\Downloads\\desk2quant-bafdf95b1251.json';
let credentials;
try {
    credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log('✓ Successfully loaded credentials for client email:', credentials.client_email);
} catch (err) {
    console.error('Failed to load credentials:', err.message);
    process.exit(1);
}

async function getAccessToken(clientEmail, privateKey) {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const base64Encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

    const tokenInput = `${base64Encode(header)}.${base64Encode(claimSet)}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.write(tokenInput);
    signer.end();
    const signature = signer.sign(privateKey, 'base64url');

    const jwt = `${tokenInput}.${signature}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google OAuth failed: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Test fetching token and reading metadata for one of the product file/folder IDs
async function main() {
    try {
        console.log('Fetching Google access token...');
        const token = await getAccessToken(credentials.client_email, credentials.private_key);
        console.log('✓ Successfully fetched Google Drive access token!');

        // Folder ID provided by user
        const testFolderId = '1348-cdCTCvQlzvdcArxA__4N6t0cIBy6';
        console.log(`Fetching metadata for test Folder ID: ${testFolderId}...`);

        let metadataResp = await fetch(`https://www.googleapis.com/drive/v3/files/${testFolderId}?fields=id,name,permissions,mimeType`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (metadataResp.ok) {
            const metadata = await metadataResp.json();
            console.log('✓ Successfully retrieved folder metadata:');
            console.log(JSON.stringify(metadata, null, 2));
        } else {
            console.warn(`✖ Failed to fetch folder metadata:`, await metadataResp.text());
            return;
        }

        // Test 1: Add reader permission for amitjha20250305@gmail.com on the folder
        const testEmail = 'amitjha20250305@gmail.com';
        console.log(`\nAdding reader permission for ${testEmail} on folder...`);
        const permissionResp = await fetch(`https://www.googleapis.com/drive/v3/files/${testFolderId}/permissions?sendNotificationEmail=false`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'user',
                emailAddress: testEmail
            })
        });

        if (permissionResp.ok) {
            const permData = await permissionResp.json();
            console.log('✓ Successfully added reader permission to folder! Details:');
            console.log(JSON.stringify(permData, null, 2));
        } else {
            console.error(`✖ Failed to add permission to folder:`, await permissionResp.text());
        }

        // Test 2: List files inside the folder
        console.log(`\nListing files inside the folder ${testFolderId}...`);
        const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q='${testFolderId}'+in+parents&fields=files(id,name,mimeType,copyRequiresWriterPermission)`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (listResp.ok) {
            const listData = await listResp.json();
            console.log(`✓ Found ${listData.files.length} files in the folder:`);
            console.log(JSON.stringify(listData.files, null, 2));

            if (listData.files.length > 0) {
                const firstFile = listData.files.find(f => f.mimeType === 'application/pdf');
                if (firstFile) {
                    console.log(`\nTesting if we can set copyRequiresWriterPermission to true on file inside folder: ${firstFile.name} (${firstFile.id})...`);
                    const fileUpdateResp = await fetch(`https://www.googleapis.com/drive/v3/files/${firstFile.id}`, {
                        method: 'PATCH',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            copyRequiresWriterPermission: true
                        })
                    });

                    if (fileUpdateResp.ok) {
                        console.log(`✓ SUCCESS! Programmatically disabled download/copy/print for readers on file: ${firstFile.name}`);
                    } else {
                        console.warn(`✖ Failed to update copy restriction on file inside folder:`, await fileUpdateResp.text());
                    }
                }
            }
        } else {
            console.error(`✖ Failed to list folder contents:`, await listResp.text());
        }

    } catch (err) {
        console.error('ERROR during testing:', err.message);
    }
}

main();
