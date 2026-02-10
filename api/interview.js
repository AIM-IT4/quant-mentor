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

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Groq API key not configured' });
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
        let conversation = [];

        // 1. Construct messages for Groq (OpenAI-compatible format)
        if (action === 'start') {
            conversation = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Begin the interview now. Introduce yourself briefly (1-2 lines, using a realistic name) and ask your first question. Keep the intro short.' }
            ];
        } else if (action === 'respond') {
            conversation = [
                { role: 'system', content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }))
            ];
        } else if (action === 'evaluate') {
            conversation = [
                { role: 'system', content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                })),
                {
                    role: 'user', content: `The interview is now over. Please provide a detailed performance scorecard in this EXACT format:

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

Be honest and constructive. Base scores strictly on the candidate's actual answers during this session.` }
            ];
        } else {
            return res.status(400).json({ error: 'Invalid action. Use: start, respond, evaluate' });
        }

        // 2. Call Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Latest Llama 3.3 70B
                messages: conversation,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 1,
                stream: false
            })
        });

        if (!groqResponse.ok) {
            const errorData = await groqResponse.text();
            console.error('Groq API error:', groqResponse.status, errorData);

            // User-friendly error messages
            if (groqResponse.status === 429) {
                return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again.' });
            }
            if (groqResponse.status === 401 || groqResponse.status === 403) {
                return res.status(403).json({ error: 'API key is invalid. Please check GROQ_API_KEY configuration.' });
            }
            return res.status(500).json({ error: 'AI service error: ' + groqResponse.status, details: errorData });
        }

        const groqData = await groqResponse.json();
        const reply = groqData.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ error: 'No response from AI' });
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Interview API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
