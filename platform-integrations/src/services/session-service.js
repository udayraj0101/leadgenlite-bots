const pool = require('../../db/config');
const leadRepository = require('../../db/repositories/lead-repository');

class SessionService {
  async linkByEmail(organizationId, currentUserId, email) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingLead = await client.query(
        'SELECT * FROM leads WHERE organization_id = $1 AND email = $2 AND platform_user_id != $3 LIMIT 1',
        [organizationId, email, currentUserId]
      );

      if (existingLead.rows.length > 0) {
        const oldLead = existingLead.rows[0];
        const currentLead = await leadRepository.getLeadByPlatformUser(organizationId, 'web', currentUserId);
        
        if (currentLead) {
          await client.query(
            'UPDATE conversations SET lead_id = $1 WHERE lead_id = $2',
            [currentLead.id, oldLead.id]
          );

          const mergedEntities = { ...oldLead.entities, ...currentLead.entities };
          
          await client.query(
            `UPDATE leads SET 
              entities = $1,
              lead_score = GREATEST(lead_score, $2),
              message_count = message_count + $3
            WHERE id = $4`,
            [JSON.stringify(mergedEntities), oldLead.lead_score, oldLead.message_count, currentLead.id]
          );

          await client.query('DELETE FROM leads WHERE id = $1', [oldLead.id]);
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new SessionService();
