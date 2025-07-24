const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async generateResponse(message, conversationHistory = [], preferredLanguage = null) {
    try {
      // Determine response language
      const isChineseInput = /[\u4e00-\u9fff]/.test(message);
      const shouldUseChinese = preferredLanguage === 'chinese' || isChineseInput;
      
      // Build context for elderly care
      let context = `You are a caring companion for elderly people dealing with grief and loneliness. Be warm, empathetic, and supportive. 

Guidelines:
- ${shouldUseChinese ? 'Respond in Chinese (中文)' : 'Respond in English'}
- Keep responses brief and easy to understand (1-3 sentences)
- Be patient and encouraging
- Show genuine care and interest
- Always be gentle and understanding
- Use simple, warm language appropriate for elderly users

Recent conversation:
`;

      // Add conversation history
      conversationHistory.slice(-6).forEach(msg => {
        context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });

      context += `\nUser: ${message}\nAssistant:`;

      console.log('Sending to Gemini:', context);

      const response = await axios.post(this.baseUrl, {
        contents: [
          {
            parts: [
              {
                text: context
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 150,
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
      console.log('Gemini responded:', aiResponse);
      return aiResponse;

    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      
      // Determine language for error response
      const isChineseInput = /[\u4e00-\u9fff]/.test(message);
      
      if (isChineseInput) {
        return '我在这里陪着你。有什么想说的吗？';
      } else {
        return "I'm here with you. What would you like to talk about?";
      }
    }
  }
}

module.exports = new GeminiService();