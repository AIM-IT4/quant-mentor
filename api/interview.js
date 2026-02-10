// AI Interview Prep — Gemini API Backend
// Vercel Serverless Function
// POST /api/interview

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const { action, messages, topic, difficulty } = req.body;

    // System prompt — the quant interviewer persona
    const systemPrompt = `You are a senior quant interviewer at a top-tier investment bank (Goldman Sachs / JP Morgan / Citadel level). You are conducting a live mock interview for a quantitative finance role.

INTERVIEW RULES:
- Ask ONE question at a time. Wait for the candidate's response before proceeding.
- Questions must be realistic, unique, and desk-relevant — the kind actually asked in real quant interviews, not textbook exercises.
- Mix question types: conceptual understanding, quick mental math, derivation sketches, coding logic, and practical scenario-based questions.
- After the candidate answers, give brief feedback (1-2 lines: what was good, what was missed) then ask the next question.
- Keep a professional but encouraging tone. Push the candidate to think deeper if the answer is surface-level.
- Track which questions the candidate answered well vs poorly internally.
- Never reveal the full solution immediately — guide with hints if the candidate is stuck.
- Vary difficulty within the session — start moderate, ramp to harder, mix in a few quick-fire ones.

TOPIC FOCUS: ${topic || 'General Quant (mix of all topics)'}
DIFFICULTY: ${difficulty || 'Mid-level'}

TOPIC AREAS TO DRAW FROM:
- Stochastic Calculus: Ito's lemma applications, SDEs, Girsanov, measure changes, Feynman-Kac
- Probability & Statistics: Conditional expectation, martingales, Bayes, distributions, hypothesis testing
- Pricing & Greeks: Black-Scholes derivation, Greeks intuition, hedging strategies, smile dynamics
- Fixed Income: Yield curve construction, duration/convexity, swap pricing, rate models (HW, LMM)
- Credit: CDS pricing, hazard rates, CVA/DVA, default correlation
- Programming: Python numerical patterns, C++ memory/performance, Monte Carlo implementation
- Risk: VaR/ES, P&L attribution, model risk, stress testing
- Mental Math: Quick estimation, order of magnitude, market intuition
- FX & Commodities: Cross-currency basis, forward points, convenience yield

IMPORTANT:
- Questions should feel like a REAL interview, not a quiz. Include context like "Suppose you're on the rates desk and..."
- For mental math, give specific numbers and expect quick approximate answers.
- For coding questions, ask about approach/pseudocode, not full syntax.`;

    try {
        let geminiMessages = [];

        if (action === 'start') {
            geminiMessages = [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nBegin the interview now. Introduce yourself briefly (1-2 lines, use a realistic name) and ask your first question. Keep the intro short — get to the question quickly.` }]
                }
            ];
        } else if (action === 'respond') {
            // Build conversation history
            geminiMessages = messages.map((msg, i) => {
                if (i === 0) {
                    // First message includes system prompt
                    return {
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: i === 0 && msg.role === 'user' ? `${systemPrompt}\n\n${msg.content}` : msg.content }]
                    };
                }
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                };
            });

            // Inject system prompt into first user message if not already there
            if (geminiMessages.length > 0 && geminiMessages[0].role === 'model') {
                geminiMessages.unshift({
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nBegin the interview.` }]
                });
            }
        } else if (action === 'evaluate') {
            // Build full conversation for evaluation
            geminiMessages = [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nBegin the interview.` }]
                }
            ];

            // Add conversation history
            if (messages && messages.length > 0) {
                for (const msg of messages) {
                    geminiMessages.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                }
            }

            // Ask for evaluation
            geminiMessages.push({
                role: 'user',
                parts: [{
                    text: `The interview is now over. Please provide a detailed performance scorecard in this EXACT format:

## 📊 Interview Performance Scorecard

**Overall Score: X/10**

### Topic Scores:
| Topic | Score | Comment |
|-------|-------|---------|
| (each relevant topic) | X/10 | (brief assessment) |

### ✅ Strengths:
- (bullet points)

### ⚠️ Areas for Improvement:
- (bullet points)

### 💡 Study Recommendations:
- (specific topics/resources to focus on)

### 🎯 Interview Readiness: (Ready / Almost Ready / Needs More Prep)

Be honest and constructive. Base scores strictly on the candidate's actual answers during this session.` }]
            });
        } else {
            return res.status(400).json({ error: 'Invalid action. Use: start, respond, evaluate' });
        }

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: geminiMessages,
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.95,
                        maxOutputTokens: 2048
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorData);

            // User-friendly error messages
            if (geminiResponse.status === 429) {
                return res.status(429).json({ error: 'Rate limit reached. Please wait 60 seconds and try again.' });
            }
            if (geminiResponse.status === 403) {
                return res.status(403).json({ error: 'API key is invalid or disabled. Please check configuration.' });
            }
            return res.status(500).json({ error: 'AI service error: ' + geminiResponse.status, details: errorData });
        }

        const geminiData = await geminiResponse.json();
        const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return res.status(500).json({ error: 'No response from AI' });
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Interview API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
