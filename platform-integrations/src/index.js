require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const AgentClient = require('./agent-client');
const pool = require('../db/config');
const leadRepository = require('../db/repositories/lead-repository');
const conversationRepository = require('../db/repositories/conversation-repository');
const organizationRepository = require('../db/repositories/organization-repository');
const adminRoutes = require('../admin/routes');

const app = express();
const PORT = process.env.PORT || 3000;
const agentClient = new AgentClient();

let defaultOrganization = null;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'leadgenlite-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, '../admin/views')]);

// Admin routes
app.use('/admin', adminRoutes);

// Database connection check
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected');
});

// Load default organization
async function loadDefaultOrganization() {
  try {
    defaultOrganization = await organizationRepository.getDefaultOrganization();
    if (!defaultOrganization) {
      console.error('❌ No organization found. Run: psql -d leadgenlite -f db/seed.sql');
      process.exit(1);
    }
    console.log('✅ Organization loaded:', defaultOrganization.name);
  } catch (error) {
    console.error('❌ Failed to load organization:', error.message);
    process.exit(1);
  }
}

loadDefaultOrganization();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { user_id, message, platform = 'web', platform_data = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userId = user_id || uuidv4();

    console.log('\n' + '='.repeat(80));
    console.log('📨 NEW MESSAGE');
    console.log('='.repeat(80));
    console.log('User ID:', userId);
    console.log('Platform:', platform);
    console.log('Message:', message);

    // Get or create lead with platform-specific data
    let enrichedPlatformData = {
      ...platform_data,
      timestamp: new Date().toISOString()
    };

    // Enhanced web platform data
    if (platform === 'web') {
      const userAgent = req.headers['user-agent'];
      const parser = new UAParser(userAgent);
      const ua = parser.getResult();
      
      // Get real IP (handle proxies)
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
                 req.headers['x-real-ip'] || 
                 req.ip || 
                 req.connection.remoteAddress;
      
      // Get geolocation from IP
      const geo = geoip.lookup(ip);
      
      enrichedPlatformData = {
        ...enrichedPlatformData,
        ip: ip,
        user_agent: userAgent,
        browser: {
          name: ua.browser.name,
          version: ua.browser.version
        },
        os: {
          name: ua.os.name,
          version: ua.os.version
        },
        device: {
          type: ua.device.type || 'desktop',
          vendor: ua.device.vendor,
          model: ua.device.model
        },
        engine: {
          name: ua.engine.name,
          version: ua.engine.version
        },
        location: geo ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          coordinates: geo.ll
        } : null,
        referrer: req.headers['referer'] || req.headers['referrer'],
        language: req.headers['accept-language']?.split(',')[0],
        screen: platform_data.screen || null,
        page_url: platform_data.page_url || null
      };
    }

    let lead = await leadRepository.findOrCreate(
      defaultOrganization.id,
      platform,
      userId,
      enrichedPlatformData
    );

    console.log('\n👤 LEAD ID:', lead.id);
    console.log('📦 PLATFORM DATA:', JSON.stringify(enrichedPlatformData));

    // Get conversation history from database
    const dbHistory = await conversationRepository.getConversationHistory(lead.id);
    const history = dbHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));

    console.log('📚 CONVERSATION HISTORY:', history.length, 'messages');

    const knownEntities = lead.entities || {};
    console.log('👤 KNOWN ENTITIES:', JSON.stringify(knownEntities));

    console.log('\n🤖 CALLING AI AGENT...');
    const startTime = Date.now();

    const result = await agentClient.chat(userId, platform, message, history, knownEntities);

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response time: ${duration}ms`);

    if (!result.success) {
      return res.status(500).json({ error: 'AI agent error', details: result.error });
    }

    const { response, metadata } = result.data;

    console.log('\n✅ AI RESPONSE:');
    console.log('Response:', response.substring(0, 100) + '...');
    console.log('\n📊 METADATA:');
    console.log('  New Entities:', JSON.stringify(metadata.new_entities));
    console.log('  Intent:', metadata.intent);
    console.log('  Sentiment:', metadata.sentiment);
    console.log('  Lead Score:', metadata.lead_score);
    console.log('  Urgency:', metadata.urgency);

    // Save messages to database
    await conversationRepository.addMessage(
      lead.id,
      defaultOrganization.id,
      'user',
      message,
      { intent: metadata.intent, sentiment: metadata.sentiment }
    );

    await conversationRepository.addMessage(
      lead.id,
      defaultOrganization.id,
      'assistant',
      response
    );

    // Update lead
    const updatedEntities = { ...knownEntities, ...metadata.new_entities };
    lead = await leadRepository.updateLead(lead.id, {
      entities: updatedEntities,
      intent: metadata.intent,
      sentiment: metadata.sentiment,
      lead_score: metadata.lead_score,
      urgency: metadata.urgency,
      confidence: metadata.confidence,
      metadata: { suggested_action: metadata.suggested_action }
    });

    console.log('\n💾 UPDATED LEAD:');
    console.log('  All Entities:', JSON.stringify(lead.entities));
    console.log('  Lead Score:', lead.lead_score);

    if (metadata.should_notify_sales) {
      console.log('\n🔔 SALES ALERT!');
      console.log('  Score:', metadata.lead_score);
      console.log('  Action:', metadata.suggested_action);
    }

    console.log('='.repeat(80) + '\n');

    res.json({
      user_id: userId,
      response: response,
      metadata: metadata
    });

  } catch (error) {
    console.error('\n❌ CHAT ERROR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const lead = await leadRepository.getLeadByPlatformUser(defaultOrganization.id, 'web', userId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const conversation = await conversationRepository.getConversationHistory(lead.id);
    
    res.json({
      user_id: userId,
      lead,
      conversation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const leads = await leadRepository.getAllLeads(defaultOrganization.id);
    res.json({ leads, count: leads.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const lead = await leadRepository.getLeadByPlatformUser(defaultOrganization.id, 'web', userId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await conversationRepository.clearConversation(lead.id);
    res.json({ message: 'Conversation cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Platform server running on http://localhost:${PORT}`);
  console.log(`📊 Chat widget: http://localhost:${PORT}`);
  console.log(`🤖 AI Agent: ${process.env.AI_AGENT_URL}`);
  console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);
});
