const pool = require('../config');

class OrganizationRepository {
  async getByApiKey(apiKey) {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );
    return result.rows[0];
  }

  async getById(organizationId) {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [organizationId]
    );
    return result.rows[0];
  }

  async getDefaultOrganization() {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
    );
    return result.rows[0];
  }
}

module.exports = new OrganizationRepository();
