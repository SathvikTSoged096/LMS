const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

const RAG_BASE_URL = 'https://ragnew-seven.vercel.app';

// @desc    Ask a question contextually locked to subject section
// @route   POST /api/ai/ask
// @access  Private/Student
const askContextualQuestion = async (req, res) => {
    try {
        const { subjectId, context, query } = req.body;

        if (!context || !query) {
            return res.status(400).json({ message: 'Context and query are required' });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.json({
                answer: `[Mock AI Response]: You asked "${query}" about the context provided. Since the OPENAI_API_KEY is not set in the .env, this is a simulated response. In production, the RAG would analyze the ${context.length} characters of context and answer accordingly.`
            });
        }

        const systemPrompt = `You are a helpful teaching assistant for a college course. 
Using STRICTLY the context below from the course material, answer the student's question. 
If the answer cannot be determined from the context alone, reply EXACTLY with: 'I cannot find the answer in the provided course material.' Do not invent answers or use outside knowledge.

Course Context:
${context}
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            temperature: 0.1,
            max_tokens: 300,
        });

        res.json({ answer: response.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ message: 'Failed to process AI request. Make sure OPENAI_API_KEY is valid.' });
    }
};

// @desc    Proxy: Ask RAG chatbot a question (bypasses browser CORS)
// @route   POST /api/ai/rag-ask
// @access  Private/Student
const ragAsk = async (req, res) => {
    try {
        const response = await fetch(`${RAG_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('RAG ask proxy error:', error);
        res.status(500).json({ answer: 'Error connecting to RAG service.' });
    }
};

// @desc    Proxy: Trigger RAG database reload after content update (bypasses browser CORS)
// @route   POST /api/ai/rag-reload
// @access  Private/Instructor
const ragReloadDb = async (req, res) => {
    try {
        const response = await fetch(`${RAG_BASE_URL}/reload-db`, { method: 'POST' });
        const text = await response.text();
        res.status(response.status).send(text);
    } catch (error) {
        console.error('RAG reload proxy error:', error);
        res.status(500).json({ message: 'Error triggering RAG reload.' });
    }
};

module.exports = {
    askContextualQuestion,
    ragAsk,
    ragReloadDb,
};
