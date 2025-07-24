class ConversationService {
  constructor() {
    this.conversations = new Map();
  }

  getUserConversation(userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    return this.conversations.get(userId);
  }

  addMessage(userId, role, content) {
    const conversation = this.getUserConversation(userId);
    conversation.push({ role, content });
    
    if (conversation.length > 10) {
      conversation.splice(0, conversation.length - 10);
    }
  }

  getContext(userId) {
    return this.getUserConversation(userId);
  }
}

module.exports = new ConversationService();