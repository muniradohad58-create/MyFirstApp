const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is missing or not configured in environment variables.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are a helpful, clear, and conversational AI assistant. You answer questions accurately, explain complex concepts in accessible language, use examples when helpful, and assist with programming, writing, brainstorming, and learning. Format lengthy responses with markdown headings and lists when appropriate. Admit uncertainty rather than fabricating facts.`;

async function createChatCompletionStream(messages, model) {
  const client = getGroqClient();
  const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const stream = await client.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
      max_completion_tokens: 4096
    });
    return stream;
  } catch (error) {
    console.error('Groq SDK streaming error:', error);
    throw error;
  }
}

async function createChatCompletionNonStream(messages, model) {
  const client = getGroqClient();
  const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const formattedMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages,
      stream: false,
      temperature: 0.7,
      max_completion_tokens: 4096
    });
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq SDK error:', error);
    throw error;
  }
}

module.exports = {
  createChatCompletionStream,
  createChatCompletionNonStream
};