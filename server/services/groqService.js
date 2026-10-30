import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Send a chat completion request to Groq (ultra-fast LPU inference)
 * @param {string} prompt - The user prompt or contextual question
 * @param {Array} history - Previous messages array [{ role: 'user'|'assistant', text: string }]
 * @param {string} systemInstruction - Optional system message
 */
export const askGroq = async (prompt, history = [], systemInstruction = '') => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.includes('your-groq-api-key')) {
    return (
      `[AI Workspace Notice: Groq API Key is not configured yet]\n\n` +
      `Here is a simulated response for: "${prompt.slice(0, 100)}..."\n\n` +
      `To connect live ultra-fast Groq AI, add your GROQ_API_KEY (from https://console.groq.com/keys) to your Render environment variables or server/.env. ` +
      `Once added, Groq will instantly power AI Assistant with Llama-3.3-70B!`
    );
  }

  try {
    const formattedMessages = [];

    if (systemInstruction) {
      formattedMessages.push({
        role: 'system',
        content: systemInstruction,
      });
    } else {
      formattedMessages.push({
        role: 'system',
        content:
          'You are the AI Assistant, an intelligent and helpful AI assistant for SmartSphere workspace powered by Groq. You analyze documents, assist with writing, and answer questions clearly with high speed and precision.',
      });
    }

    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        formattedMessages.push({
          role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.text || msg.content || '',
        });
      }
    }

    // Add current prompt
    formattedMessages.push({
      role: 'user',
      content: prompt,
    });

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        timeout: 30000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    return reply || 'No response returned from Groq AI.';
  } catch (error) {
    console.error('Error calling Groq API:', error.response?.data || error.message);
    const detail = error.response?.data?.error?.message || error.message;
    return `Groq AI Error: ${detail}. Please check your GROQ_API_KEY and network connection.`;
  }
};

// Alias for backward compatibility
export const askGrok = askGroq;

/**
 * Summarize document content using Groq
 */
export const summarizeDocument = async (filename, content) => {
  if (!content || content.trim().length === 0) {
    return 'Document is empty.';
  }

  const prompt = `Please provide a concise 3-4 sentence executive summary and 3 key takeaways for the document named "${filename}":\n\n${content.slice(
    0,
    6000
  )}`;

  return await askGroq(
    prompt,
    [],
    'You are an expert document summarizer. Highlight key points cleanly in Markdown.'
  );
};

