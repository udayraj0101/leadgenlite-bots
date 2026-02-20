const pool = require('../config');

class LeadRepository {
  async findOrCreate(organizationId, platform, platformUserId, platformData = {}) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO leads (organization_id, platform, platform_user_id, platform_data, first_message_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (organization_id, platform, platform_user_id)
         DO UPDATE SET 
           last_message_at = NOW(), 
           message_count = leads.message_count + 1,
           platform_data = EXCLUDED.platform_data
         RETURNING *`,
        [organizationId, platform, platformUserId, JSON.stringify(platformData)]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateLead(leadId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // If entities are being updated, also update fixed columns
    if (updates.entities) {
      const entities = updates.entities;
      if (entities.name) {
        fields.push(`name = $${paramIndex}`);
        values.push(entities.name);
        paramIndex++;
      }
      if (entities.email) {
        fields.push(`email = $${paramIndex}`);
        values.push(entities.email);
        paramIndex++;
      }
      if (entities.phone) {
        fields.push(`phone = $${paramIndex}`);
        values.push(entities.phone);
        paramIndex++;
      }
      if (entities.company) {
        fields.push(`company = $${paramIndex}`);
        values.push(entities.company);
        paramIndex++;
      }
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'entities' || key === 'metadata' || key === 'platform_data') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    });

    values.push(leadId);

    const query = `UPDATE leads SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getLeadById(leadId) {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    return result.rows[0];
  }

  async getLeadByPlatformUser(organizationId, platform, platformUserId) {
    const result = await pool.query(
      'SELECT * FROM leads WHERE organization_id = $1 AND platform = $2 AND platform_user_id = $3',
      [organizationId, platform, platformUserId]
    );
    return result.rows[0];
  }

  async getAllLeads(organizationId, filters = {}) {
    let query = 'SELECT * FROM leads WHERE organization_id = $1';
    const values = [organizationId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.platform) {
      query += ` AND platform = $${paramIndex}`;
      values.push(filters.platform);
      paramIndex++;
    }

    if (filters.minScore) {
      query += ` AND lead_score >= $${paramIndex}`;
      values.push(filters.minScore);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = new LeadRepository();
