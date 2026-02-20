# 🚀 VPS Deployment - Existing PM2 Setup

## For VPS with Multiple Projects Running

### Step 1: Choose Available Ports

Check which ports are free:
```bash
pm2 list
netstat -tulpn | grep LISTEN
```

**Choose 2 free ports:**
- AI Agent: e.g., `8001` (if 8000 is taken)
- Platform: e.g., `3001` (if 3000 is taken)

---

### Step 2: Upload Project

```bash
# Upload via SCP
scp -r "D:\Team Projects\LeadgenLite Bots" root@your-vps-ip:/var/www/

# Or via Git
cd /var/www
git clone your-repo-url leadgenlite-bots
```

---

### Step 3: Setup PostgreSQL

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE leadgenlite;
CREATE USER leadgen_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE leadgenlite TO leadgen_user;
\q

# Import schema
cd /var/www/leadgenlite-bots/platform-integrations
psql -U leadgen_user -d leadgenlite -f db/schema_clean.sql
psql -U leadgen_user -d leadgenlite -f db/seed.sql
```

---

### Step 4: Setup Python AI Agent

```bash
cd /var/www/leadgenlite-bots/ai-brain-python

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cat > .env << EOF
OPENAI_API_KEY=your-openai-key
PORT=8001
HOST=0.0.0.0
EOF

# Test
python -m app.main
# Ctrl+C after testing
```

---

### Step 5: Setup Node.js Platform

```bash
cd /var/www/leadgenlite-bots/platform-integrations

# Install dependencies
npm install

# Create .env
cat > .env << EOF
AI_AGENT_URL=http://localhost:8001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadgenlite
DB_USER=leadgen_user
DB_PASSWORD=your-password
PORT=3001
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
TELEGRAM_BOT_TOKEN=your-telegram-token
PLATFORM_API_URL=http://localhost:3001
EOF

# Setup admin
node setup-admin-complete.js

# Test
npm start
# Ctrl+C after testing
```

---

### Step 6: Add to PM2

```bash
# Start AI Agent
cd /var/www/leadgenlite-bots/ai-brain-python
pm2 start "venv/bin/python -m app.main" --name leadgen-ai

# Start Platform
cd /var/www/leadgenlite-bots/platform-integrations
pm2 start npm --name leadgen-platform -- start

# Start Telegram Bot
pm2 start npm --name leadgen-telegram -- run telegram

# Save
pm2 save

# Check status
pm2 list
```

---

### Step 7: Update Nginx

**Add new server block:**
```bash
sudo nano /etc/nginx/sites-available/leadgenlite
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name leadgenlite.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/leadgenlite /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 8: Setup SSL

```bash
sudo certbot --nginx -d leadgenlite.yourdomain.com
```

---

### Step 9: Update Widget URL

```bash
nano /var/www/leadgenlite-bots/platform-integrations/public/widget.js
```

**Change:**
```javascript
const WIDGET_API = 'https://leadgenlite.yourdomain.com/api/chat';
```

**Restart:**
```bash
pm2 restart leadgen-platform
```

---

## 🌐 Add Widget to Website

**On your LeadGenLite website, add:**
```html
<script src="https://leadgenlite.yourdomain.com/widget.js"></script>
```

---

## 🔧 Useful Commands

```bash
# Check status
pm2 list
pm2 logs leadgen-ai
pm2 logs leadgen-platform
pm2 logs leadgen-telegram

# Restart
pm2 restart leadgen-ai
pm2 restart leadgen-platform
pm2 restart leadgen-telegram

# Stop
pm2 stop leadgen-ai
pm2 stop leadgen-platform
pm2 stop leadgen-telegram

# Delete
pm2 delete leadgen-ai
pm2 delete leadgen-platform
pm2 delete leadgen-telegram
```

---

## 📊 Access Points

- **Admin Panel**: https://leadgenlite.yourdomain.com/admin/login
- **Widget Demo**: https://leadgenlite.yourdomain.com/demo.html
- **API**: https://leadgenlite.yourdomain.com/api/chat

**Login:**
- Email: admin@leadgenlite.com
- Password: admin123

---

## 🔒 Security

```bash
# Check firewall
sudo ufw status

# If needed, allow ports
sudo ufw allow 80
sudo ufw allow 443
```

---

## 🆘 Troubleshooting

**Port already in use?**
- Choose different ports in `.env` files
- Update `AI_AGENT_URL` in platform `.env`

**PM2 not starting?**
```bash
pm2 logs leadgen-ai --lines 50
pm2 logs leadgen-platform --lines 50
```

**Database connection failed?**
```bash
psql -U leadgen_user -d leadgenlite
# Check credentials in .env
```

**Nginx error?**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

---

## 📝 Summary

**Ports Used:**
- AI Agent: 8001 (internal)
- Platform: 3001 (internal)
- Nginx: 80/443 (external)

**PM2 Processes:**
- leadgen-ai
- leadgen-platform
- leadgen-telegram

**Domain:**
- leadgenlite.yourdomain.com

**Widget Script:**
```html
<script src="https://leadgenlite.yourdomain.com/widget.js"></script>
```

---

**Everything runs on VPS, widget works on any website!** 🚀
