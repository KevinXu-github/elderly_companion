const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateResponse(message, conversationHistory = []) {
    try {
      // Build context for elderly care
      let context = `You are a caring companion for elderly people dealing with grief. Be warm, empathetic, and respond in Chinese when appropriate. Keep responses brief (1-2 sentences).

Recent conversation:
`;

      // Add conversation history
      conversationHistory.slice(-4).forEach(msg => {
        context += `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}\n`;
      });

      context += `\nUser: ${message}\nYou:`;

      const response = await axios.post(this.baseUrl, {
        contents: [
          {
            parts: [
              {
                text: context
              }
            ]
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        }
      });

      return response.data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      return '我在这里陪着你。有什么想说的吗？';
    }
  }
}

module.exports = new GeminiService();