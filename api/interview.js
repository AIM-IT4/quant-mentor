import fetch from 'node-fetch'; // Vercel environment usually has node-fetch or global fetch. We'll rely on global fetch if possible, or standard node http. Actually Vercel supports fetch natively in Node 18+.

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const { action, messages, topic, difficulty, paymentId, email, name } = req.body;

    // System prompt — the quant interviewer persona
    const systemPrompt = `You are a senior quant interviewer at a top-tier investment bank (Goldman Sachs / JP Morgan / Citadel level). You are conducting a live mock interview for a quantitative finance role.

INTERVIEW RULES:
- Ask ONE question at a time. Wait for the candidate's response before proceeding.
- Questions must be realistic, unique, and desk-relevant.
- Mix question types: conceptual understanding, quick mental math, derivation sketches, coding logic, and practical scenarios.
- After the candidate answers, give brief feedback (1-2 lines) then ask the next question.
- Track which questions the candidate answered well vs poorly internally.
- Never reveal the full solution immediately — guide with hints.
- Vary difficulty within the session.

TOPIC FOCUS: ${topic || 'General Quant'}
DIFFICULTY: ${difficulty || 'Mid-level'}

IMPORTANT:
- Questions should feel like a REAL interview, not a quiz.
- For mental math, give specific numbers and expect quick approximate answers.
- For coding questions, ask about approach/pseudocode, not full syntax.
- Do NOT start every response with generic praise ("Good job", "Correct"). Be varied: "Right.", "Okay.", "Let's move on.", or just ask the next question.
- If the candidate is vague, grill them: "Why? Be specific." or "Are you sure?"
- Maintain the persona of a busy, sharp practitioner. Encouraging but demanding.`;

    try {
        let conversation = [];

        // 1. START INTERVIEW
        if (action === 'start') {
            conversation = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Begin the interview now. Introduce yourself briefly (1-2 lines, using a realistic name) and ask your first question. Keep the intro short.' }
            ];

            // Log payment if present (future use)
            if (paymentId) console.log(`Starting interview for ${email} (${name}), Payment: ${paymentId}`);

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-70b-8192',
                    messages: conversation,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Start Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            return res.status(200).json({ reply: data.choices[0].message.content });
        }

        // 2. EVALUATE (END)
        if (action === 'evaluate') {
            // Generate Scorecard
            const evalConversation = [
                { role: 'system', content: systemPrompt },
                ...messages,
                { role: 'user', content: 'The interview is over. Generate a detailed performance scorecard in Markdown. Include: 1. Topic-wise rating (1-10), 2. Strengths, 3. Weaknesses, 4. Actionable study plan. Do not ask any more questions. Just the report.' }
            ];

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-70b-8192',
                    messages: evalConversation,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq API Eval Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            const markdownReport = data.choices[0].message.content;

            // Send Email
            if (email) {
                try {
                    await sendEmailReport(email, name || 'Candidate', markdownReport);
                } catch (emailErr) {
                    console.error('Failed to send email:', emailErr);
                }
            }

            return res.status(200).json({ reply: "Report generated and sent." });
        }

        // 3. RESPOND (CHAT)
        // Default action if not start/evaluate
        conversation = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: conversation,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            // User-friendly error messages
            if (response.status === 429) {
                return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
            }
            throw new Error(`Groq API Chat Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return res.status(200).json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'AI service error', details: error.message });
    }
}

// Helper: Simple Markdown to HTML for Email
function markdownToHtml(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gm, '<h3 style="color:#2563eb;margin-top:20px;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="color:#1e40af;margin-top:25px;border-bottom:1px solid #ddd;padding-bottom:5px;">$1</h2>')
        .replace(/^- (.*$)/gm, '<li style="margin-bottom:5px;">$1</li>')
        .replace(/\n/g, '<br>');
}

// Helper: Send Email via Brevo
async function sendEmailReport(toEmail, toName, reportMarkdown) {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
        console.warn('BREVO_API_KEY missing, skipping email');
        return;
    }

    const htmlReport = markdownToHtml(reportMarkdown);
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin:0;">QuantMentor AI Interview Results</h1>
            </div>
            <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p>Hi <strong>${toName}</strong>,</p>
                <p>Here is the detailed scorecard from your recent mock interview.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    ${htmlReport}
                </div>

                <div style="margin-top: 30px; text-align: center; font-size: 0.9em; color: #64748b;">
                    <p>Keep practicing! <a href="https://quant-mentor.vercel.app" style="color: #2563eb;">Book a 1:1 session</a> for personalized feedback.</p>
                </div>
            </div>
        </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { email: 'jha.8@alumni.iitj.ac.in', name: 'QuantMentor AI' },
            to: [{ email: toEmail, name: toName }],
            subject: 'Your AI Interview Scorecard 📊',
            htmlContent: htmlContent
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Brevo API Error: ${err}`);
    }
    console.log(`Email sent to ${toEmail}`);
}
