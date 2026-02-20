# LeadGenLite Bots

Multi-platform AI chatbot system for lead generation with web widget, Telegram bot, and admin panel.

## 🚀 Features

- **AI-Powered Conversations**: OpenAI-based intelligent chatbot
- **Multi-Platform Support**: Web widget + Telegram bot
- **Admin Panel**: Dashboard, leads management, analytics, CSV export
- **Enhanced Tracking**: IP geolocation, browser detection, device info
- **Database Storage**: PostgreSQL with platform-specific metadata
- **Embeddable Widget**: Single script tag integration

## 📁 Project Structure

```
leadgenlite-bots/
├── ai-brain-python/          # Python FastAPI AI agent (Port 8000)
│   ├── app/
│   │   ├── agent/            # AI agent logic and tools
│   │   ├── api/              # API endpoints
│   │   └── prompts/          # System prompts
│   └── requirements.txt
│
├── platform-integrations/    # Node.js Express backend (Port 3000)
│   ├── admin/                # Admin panel (EJS templates)
│   ├── db/                   # Database schema and migrations
│   ├── public/               # Web widget and demo pages
│   └── src/                  # Backend services and Telegram bot
│
├── ROADMAP.md               # Project roadmap and status
└── VPS_DEPLOYMENT.md        # VPS deployment guide
```

## 🛠️ Tech Stack

- **AI Agent**: Python, FastAPI, OpenAI API, LangChain
- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: Vanilla JS, EJS templates, Chart.js
- **Bots**: Telegram Bot API
- **Tracking**: geoip-lite, ua-parser-js

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- OpenAI API key
- Telegram Bot Token (optional)

### 1. Clone Repository

```bash
git clone https://github.com/udayraj0101/leadgenlite-bots.git
cd leadgenlite-bots
```

### 2. Setup AI Agent (Python)

```bash
cd ai-brain-python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
python -m app.main
```

AI agent runs on `http://localhost:8000`

### 3. Setup Platform (Node.js)

```bash
cd platform-integrations
npm install
cp .env.example .env
# Edit .env with your database credentials and Telegram token
```

### 4. Setup Database

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE leadgenlite;
\q

# Run schema
psql -U postgres -d leadgenlite -f db/schema_clean.sql

# Add admin columns
psql -U postgres -d leadgenlite -f db/add-admin-columns.sql

# Setup admin credentials
node setup-admin-complete.js
```

### 5. Start Platform

```bash
npm start
```

Platform runs on `http://localhost:3000`

### 6. Start Telegram Bot (Optional)

```bash
node src/telegram-bot.js
```

## 🌐 Usage

### Web Widget Integration

Add this script to any webpage:

```html
<script src="http://localhost:3000/widget.js"></script>
```

For production, replace with your domain:

```html
<script src="https://yourdomain.com/widget.js"></script>
```

### Admin Panel Access

- URL: `http://localhost:3000/admin/login`
- Email: `admin@leadgenlite.com`
- Password: `admin123`

### Telegram Bot

Search for your bot on Telegram and start chatting!

## 📊 Platform Data Tracking

### Web Platform
- IP geolocation (country, city)
- Browser and OS detection
- Device type and screen resolution
- Page URL and referrer

### Telegram Platform
- Username and name
- Language code
- Chat ID

## 🚢 Deployment

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for detailed VPS deployment instructions with PM2 and Nginx.

## 📈 Project Status

**90% Complete** - See [ROADMAP.md](ROADMAP.md) for details

✅ Completed:
- AI agent with LeadGenLite tools
- Web widget with enhanced tracking
- Telegram bot integration
- Admin panel with analytics
- Database schema and migrations

🔄 Optional:
- Redis caching
- WhatsApp integration

## 🔒 Security Notes

- Never commit `.env` files
- Use `.env.example` as template
- Change default admin password in production
- Use HTTPS in production
- Secure database credentials

## 📝 License

Private project - All rights reserved

## 👤 Author

Uday Raj
