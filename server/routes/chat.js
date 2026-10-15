const express = require('express');
const router = express.Router();
const { createChatCompletionStream, createChatCompletionNonStream } = require('../services/groq');

router.post('/', async (req, res) => {
  try {
    const { messages, model, stream = true } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing messages array in request body.' });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY is not set.' });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const groqStream = await createChatCompletionStream(messages, model);

        for await (const chunk of groqStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error encountered:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: streamError.message || 'Error communicating with Groq API.' });
        } else {
          res.write(`data: ${JSON.stringify({ error: streamError.message || 'Stream interrupted.' })}\n\n`);
          res.end();
        }
      }
    } else {
      const content = await createChatCompletionNonStream(messages, model);
      res.json({ content });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error while processing chat.' });
    }
  }
});

module.exports = router;