# LeadgenLite Platform - Web Chat Integration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd platform-integrations
npm install
```

### 2. Start Python AI Agent (Terminal 1)
```bash
cd ../ai-brain-python
venv\Scripts\activate
python -m app.main
```

### 3. Start Node.js Platform (Terminal 2)
```bash
cd platform-integrations
npm start
```

### 4. Open Chat Widget
```
http://localhost:3000
```

---

## 📁 Project Structure

```
platform-integrations/
├── src/
│   ├── index.js              # Express server
│   ├── agent-client.js       # Python AI API client
│   └── conversation-store.js # In-memory storage
├── public/
│   └── index.html            # Chat widget
├── package.json
├── .env
└── README.md
```

---

## 🔌 API Endpoints

### POST /api/chat
Send a message to the AI agent

**Request:**
```json
{
  "user_id": "optional-user-id",
  "message": "What's your pricing?",
  "platform": "web"
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "response": "We have three pricing plans...",
  "metadata": {
    "new_entities": {"name": "John"},
    "intent": "pricing_inquiry",
    "sentiment": "neutral",
    "lead_score": 35,
    "should_notify_sales": false
  }
}
```

### GET /api/conversation/:userId
Get conversation history for a user

### GET /api/leads
Get all leads (for testing)

### DELETE /api/conversation/:userId
Clear conversation history

---

## 🧪 Testing

### Test with Chat Widget:
1. Open http://localhost:3000
2. Type: "My name is John. What's your pricing?"
3. See AI extract name and provide pricing
4. Continue conversation to see lead scoring

### Test with curl:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need pricing info"}'
```

---

## 🎯 Features

✅ Beautiful chat widget UI
✅ Real-time conversation
✅ AI-powered responses
✅ Entity extraction display
✅ Lead scoring badges
✅ Typing indicators
✅ Conversation persistence (in-memory)
✅ Sales notifications (console logs)

---

## 🔄 How It Works

```
User types message in widget
    ↓
POST /api/chat
    ↓
Load conversation history (in-memory)
    ↓
Call Python AI Agent API
    ↓
Save messages to memory
    ↓
Update lead data
    ↓
Return response to widget
    ↓
Display with metadata badges
```

---

## 📊 Lead Scoring

The widget shows lead scores in real-time:
- **Green badge:** Score >= 70 (qualified lead)
- **Gray badge:** Score < 70 (nurture)

Console logs show sales notifications for qualified leads.

---

## 🚀 Next Steps

1. ✅ Test the chat widget
2. ⏳ Add PostgreSQL for permanent storage
3. ⏳ Add Redis for caching
4. ⏳ Add Telegram integration
5. ⏳ Add WhatsApp integration

---

## 🐛 Troubleshooting

**Chat widget shows connection error:**
- Make sure Python AI agent is running on port 8000
- Make sure Node.js server is running on port 3000

**AI responses are slow:**
- Normal for first request (cold start)
- Subsequent requests should be faster

**Port already in use:**
- Change PORT in .env file
- Or kill process on port 3000

---

**Status:** ✅ Working Prototype  
**Next:** Add database integration
