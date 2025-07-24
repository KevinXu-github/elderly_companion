const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geminiService = require('./services/gemini');
const conversationService = require('./services/conversation');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'default_user', preferredLanguage = null } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string',
        message: 'Please provide a valid message.'
      });
    }

    console.log(`[${new Date().toISOString()}] User (${userId}) said:`, message);

    // Add user message to conversation history
    conversationService.addMessage(userId, 'user', message);
    const history = conversationService.getContext(userId);
    
    // Generate AI response
    const response = await geminiService.generateResponse(message, history, preferredLanguage);
    
    // Add AI response to conversation history
    conversationService.addMessage(userId, 'assistant', response);
    
    console.log(`[${new Date().toISOString()}] AI replied:`, response);
    res.json({ message: response });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Chat error:`, error);
    
    // Determine appropriate error message language
    const message = req.body?.message || '';
    const isChineseInput = /[\u4e00-\u9fff]/.test(message);
    
    const errorResponse = isChineseInput 
      ? '我在这里陪着你。请再说一遍好吗？'
      : "I'm here for you. Could you please try again?";
    
    res.status(500).json({ 
      message: errorResponse,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});