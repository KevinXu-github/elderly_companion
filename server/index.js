const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geminiService = require('./services/gemini');
const conversationService = require('./services/conversation');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'default_user' } = req.body;
    console.log('User said:', message);

    conversationService.addMessage(userId, 'user', message);
    const history = conversationService.getContext(userId);
    
    const response = await geminiService.generateResponse(message, history);
    conversationService.addMessage(userId, 'assistant', response);
    
    console.log('AI replied:', response);
    res.json({ message: response });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ message: '我在这里陪着你。请再说一遍好吗？' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});