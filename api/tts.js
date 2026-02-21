export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
    }

    const { text, voice } = req.body;
    if (!text || text.trim().length < 2) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // Truncate to safe limit — keep responses short for fast TTS
    // Shorter text = smaller audio file = stays under Vercel payload limit
    const inputText = text.substring(0, 2000);

    console.log(`TTS Request: voice=${voice || 'troy'}, text_len=${inputText.length}`);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'canopylabs/orpheus-v1-english',
                input: inputText,
                voice: voice || 'troy',
                response_format: 'wav'
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq TTS Error:', response.status, errText);
            return res.status(response.status).json({
                error: `TTS API Error: ${response.status}`,
                detail: errText.substring(0, 200)
            });
        }

        // Stream the audio binary directly to the client
        const audioBuffer = Buffer.from(await response.arrayBuffer());

        console.log(`TTS Response: ${audioBuffer.length} bytes`);

        // Check if response is too large (Vercel limit ~4.5MB)
        if (audioBuffer.length > 4000000) {
            console.warn('TTS audio too large, truncating text and retrying');
            // Retry with shorter text
            const shortText = inputText.substring(0, 800);
            const retryResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'canopylabs/orpheus-v1-english',
                    input: shortText,
                    voice: voice || 'troy',
                    response_format: 'wav'
                })
            });

            if (!retryResponse.ok) {
                return res.status(500).json({ error: 'TTS retry failed' });
            }

            const retryBuffer = Buffer.from(await retryResponse.arrayBuffer());
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', retryBuffer.length);
            res.setHeader('Cache-Control', 'no-cache');
            return res.status(200).send(retryBuffer);
        }

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(audioBuffer);

    } catch (error) {
        console.error('TTS Proxy Error:', error.message);
        return res.status(500).json({ error: error.message || 'TTS service error' });
    }
}
