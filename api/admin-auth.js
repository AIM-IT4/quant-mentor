export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Password is required' });
        }

        if (!adminPassword) {
            console.error('SERVER ERROR: ADMIN_PASSWORD is not configured in Vercel environment variables');
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        // Basic verification
        if (password === adminPassword) {
            // Success: Return a token or simple OK that the client checks
            // For now, this just validates the password so the client can show the dash
            return res.status(200).json({ success: true });
        } else {
            // Failed
            return res.status(401).json({ success: false, error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Admin Auth Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
