const axios = require('axios');

class AgentClient {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.AI_AGENT_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async chat(userId, platform, message, history = [], knownEntities = {}) {
    try {
      const payload = {
        user_id: userId,
        platform: platform,
        message: message,
        history: history,
        platform_data: {},
        known_entities: knownEntities
      };

      console.log('\n🚀 AGENT API REQUEST:');
      console.log('URL:', `${this.baseURL}/agent/chat`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/agent/chat', payload);

      console.log('\n✅ AGENT API RESPONSE:');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('\n❌ AGENT API ERROR:');
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

module.exports = AgentClient;
