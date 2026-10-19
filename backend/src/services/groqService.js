const axios = require('axios');
require('dotenv').config();

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

const groqClient = axios.create({
  baseURL: GROQ_API_BASE,
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function analyzeCode(filename, patch) {
  const prompt = `You are an expert code reviewer. Review the following code change from file "${filename}".

The code change (in git diff format):
${patch}

Provide a concise code review covering:
1. Potential bugs or issues
2. Best practice violations
3. Suggestions for improvement

If the code looks fine, say so briefly. Keep your response under 200 words.`;

  try {
    const response = await groqClient.post('/chat/completions', {
      model: process.env.GROQ_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      console.error('Groq API error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Groq request error:', error.message);
    }
    throw error;
  }
}

module.exports = {
  analyzeCode
};