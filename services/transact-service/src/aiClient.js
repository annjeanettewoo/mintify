const axios = require('axios');

const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1-mini';

async function getSpendingAdvice(summaryText) {
    if (!AI_API_URL || !AI_API_KEY) {
        console.warn('AI_API_URL or AI_API_KEY not set, returning fallback advice.');
        return 'AI advice is temporarily unavailable due to a configuration issue.';
    }

    try {
        const response = await axios.post(
            AI_API_URL,
            {
                model: AI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a concise personal finance coach. Give practical, friendly budgeting tips.',
                    },
                    {
                        role: 'user',
                        content:
                            'Here is my recent spending summary. Please give 3-5 short, actionable tips I can apply this month:\n\n' +
                            summaryText,
                    },
                ],
                max_tokens: 400,
            },
            {
                headers: {
                    Authorization: `Bearer ${AI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const choice = response.data.choices?.[0];
        const advice = choice?.message?.content?.trim();
        return advice || 'No advice generated.';
    } catch (err) {
        console.error('Error calling AI API.', err.response?.data || err.message);
        return 'AI advice is temporarily unavailable due to an error.';
    }
}

module.exports = { getSpendingAdvice };
