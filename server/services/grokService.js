import axios from 'axios';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Send a chat completion request to xAI Grok
 * @param {string} prompt - The user prompt or contextual question
 * @param {Array} history - Previous messages array [{ role: 'user'|'assistant', text: string }]
 * @param {string} systemInstruction - Optional system message
 */
export const askGrok = async (prompt, history = [], systemInstruction = '') => {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

  if (!apiKey || apiKey.includes('your-grok-api-key')) {
    return (
      `[AI Workspace Notice: Grok API Key is not set yet]\n\n` +
      `Here is a simulated response for: "${prompt.slice(0, 100)}..."\n\n` +
      `To connect live Grok AI, add your GROK_API_KEY to your server .env or Render dashboard. ` +
      `Once configured, Grok will answer questions about your documents and files with real-time reasoning.`
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
          'You are BuddyBot, an intelligent and helpful AI assistant for SmartSphere workspace. You analyze documents, assist with writing, and answer questions clearly.',
      });
    }

    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        formattedMessages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
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
      GROK_API_URL,
      {
        model: process.env.GROK_MODEL || 'grok-beta',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 45000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    return reply || 'No response returned from Grok AI.';
  } catch (error) {
    console.error('Error calling Grok API:', error.response?.data || error.message);
    const detail = error.response?.data?.error || error.message;
    return `Grok AI Error: ${detail}. Please check your GROK_API_KEY and network connection.`;
  }
};

/**
 * Summarize document content using Grok
 */
export const summarizeDocument = async (filename, content) => {
  if (!content || content.trim().length === 0) {
    return 'Document is empty.';
  }

  const prompt = `Please provide a concise 3-4 sentence executive summary and 3 key takeaways for the document named "${filename}":\n\n${content.slice(
    0,
    6000
  )}`;

  return await askGrok(
    prompt,
    [],
    'You are an expert document summarizer. Highlight key points cleanly in Markdown.'
  );
};

