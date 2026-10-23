const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const chatRouter = require('./routes/chat');
const rateLimit = require('./middleware/rateLimit');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here');
  res.json({
    status: 'ok',
    configured: hasKey,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    timestamp: new Date().toISOString()
  });});
app.use('/api/chat', rateLimit, chatRouter);
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    console.warn('⚠️ WARNING: GROQ_API_KEY is not configured. Please set it in your .env file.');
  }});