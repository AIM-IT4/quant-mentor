const fs = require('fs');
const path = require('path');

// config.js content based on environment variables
const content = `// Auto-generated config.js
const CONFIG = {
    BREVO_API_KEY: '${process.env.BREVO_API_KEY || 'xkeysib-your-api-key-here'}',
    BREVO_SENDER_EMAIL: '${process.env.BREVO_SENDER_EMAIL || 'jha.8@alumni.iitj.ac.in'}',
    BREVO_SENDER_NAME: '${process.env.BREVO_SENDER_NAME || 'QuantMentor'}'
};
window.CONFIG = CONFIG;
`;

const configPath = path.join(__dirname, 'config.js');

try {
    fs.writeFileSync(configPath, content);
    console.log('✅ Successfully generated config.js from environment variables');
} catch (err) {
    console.error('❌ Failed to generate config.js:', err);
    process.exit(1);
}
