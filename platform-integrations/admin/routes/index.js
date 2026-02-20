const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const organizationRepository = require('../../db/repositories/organization-repository');
const leadRepository = require('../../db/repositories/lead-repository');
const conversationRepository = require('../../db/repositories/conversation-repository');
const pool = require('../../db/config');

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM organizations WHERE email = $1', [email]);
    const org = result.rows[0];
    
    if (!org || !bcrypt.compareSync(password, org.password_hash)) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    req.session.organizationId = org.id;
    req.session.organizationName = org.name;
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('login', { error: 'Login failed' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const orgId = req.session.organizationId;
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN platform = 'web' THEN 1 END) as web_leads,
        COUNT(CASE WHEN platform = 'telegram' THEN 1 END) as telegram_leads,
        COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_score,
        AVG(lead_score) as avg_score,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today
      FROM leads WHERE organization_id = $1
    `, [orgId]);
    
    const recentLeads = await pool.query(`
      SELECT * FROM leads 
      WHERE organization_id = $1 
      ORDER BY created_at DESC LIMIT 10
    `, [orgId]);
    
    res.render('dashboard', {
      orgName: req.session.organizationName,
      stats: stats.rows[0],
      recentLeads: recentLeads.rows
    });
  } catch (error) {
    res.status(500).send('Error loading dashboard');
  }
});

// Leads list
router.get('/leads', requireAuth, async (req, res) => {
  try {
    const orgId = req.session.organizationId;
    const leads = await leadRepository.getAllLeads(orgId);
    
    res.render('leads', {
      orgName: req.session.organizationName,
      leads
    });
  } catch (error) {
    res.status(500).send('Error loading leads');
  }
});

// Lead detail
router.get('/leads/:id', requireAuth, async (req, res) => {
  try {
    const lead = await leadRepository.getLeadById(req.params.id);
    const conversation = await conversationRepository.getConversationHistory(req.params.id);
    
    res.render('lead-detail', {
      orgName: req.session.organizationName,
      lead,
      conversation
    });
  } catch (error) {
    res.status(500).send('Error loading lead');
  }
});

// Analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const orgId = req.session.organizationId;
    
    const intents = await pool.query(`
      SELECT intent, COUNT(*) as count
      FROM leads WHERE organization_id = $1 AND intent IS NOT NULL
      GROUP BY intent ORDER BY count DESC
    `, [orgId]);
    
    const timeline = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM leads WHERE organization_id = $1 
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) ORDER BY date ASC
    `, [orgId]);
    
    res.render('analytics', {
      orgName: req.session.organizationName,
      intents: intents.rows,
      timeline: timeline.rows
    });
  } catch (error) {
    res.status(500).send('Error loading analytics');
  }
});

// Export CSV
router.get('/export', requireAuth, async (req, res) => {
  try {
    const leads = await leadRepository.getAllLeads(req.session.organizationId);
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Platform', 'Platform User ID', 'Score', 'Intent', 'Sentiment', 'IP', 'User Agent', 'Created'].join(','),
      ...leads.map(l => {
        const platformData = l.platform_data || {};
        return [
          l.name || '',
          l.email || '',
          l.phone || '',
          l.company || '',
          l.platform,
          l.platform_user_id || '',
          l.lead_score,
          l.intent || '',
          l.sentiment || '',
          platformData.ip || '',
          platformData.user_agent || '',
          new Date(l.created_at).toISOString()
        ].join(',');
      })
    ].join('\n');
    
    res.header('Content-Type', 'text/csv');
    res.attachment('leads.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).send('Export failed');
  }
});

module.exports = router;
