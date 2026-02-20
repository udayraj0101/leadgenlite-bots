class ConversationStore {
  constructor() {
    this.conversations = new Map();
    this.leads = new Map();
  }

  getConversation(userId) {
    return this.conversations.get(userId) || [];
  }

  addMessage(userId, role, content) {
    const conversation = this.getConversation(userId);
    conversation.push({ role, content, timestamp: new Date() });
    this.conversations.set(userId, conversation);
  }

  getLead(userId) {
    return this.leads.get(userId) || {
      user_id: userId,
      entities: {},
      intent: null,
      sentiment: null,
      lead_score: 0,
      created_at: new Date()
    };
  }

  updateLead(userId, updates) {
    const lead = this.getLead(userId);
    const updatedLead = {
      ...lead,
      ...updates,
      updated_at: new Date()
    };
    this.leads.set(userId, updatedLead);
    return updatedLead;
  }

  clearConversation(userId) {
    this.conversations.delete(userId);
  }

  getAllLeads() {
    return Array.from(this.leads.values());
  }
}

module.exports = new ConversationStore();
