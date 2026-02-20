const pool = require('../config');

class ConversationRepository {
  async addMessage(leadId, organizationId, role, content, metadata = {}) {
    const result = await pool.query(
      `INSERT INTO conversations (lead_id, organization_id, role, content, intent, sentiment, entities_extracted, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        leadId,
        organizationId,
        role,
        content,
        metadata.intent || null,
        metadata.sentiment || null,
        JSON.stringify(metadata.entities_extracted || {})
      ]
    );
    return result.rows[0];
  }

  async getConversationHistory(leadId, limit = 50) {
    const result = await pool.query(
      `SELECT role, content, intent, sentiment, timestamp
       FROM conversations
       WHERE lead_id = $1
       ORDER BY timestamp ASC
       LIMIT $2`,
      [leadId, limit]
    );
    return result.rows;
  }

  async clearConversation(leadId) {
    await pool.query('DELETE FROM conversations WHERE lead_id = $1', [leadId]);
  }

  async getConversationCount(leadId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM conversations WHERE lead_id = $1',
      [leadId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new ConversationRepository();
