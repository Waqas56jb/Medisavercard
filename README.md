# Medisavercard# MediSaver AI Chatbot — Production Ready

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set API Key (for AI responses)
```bash
# Windows
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# Mac/Linux
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Start Server
```bash
npm start
```

### 4. Open Browser
Visit: http://localhost:3000

---

## Features Included

✅ Full AI Agent (Claude claude-opus-4-5 powered)
✅ Multilingual: EN, ES, FR, PT, DE, HT + auto-detect
✅ Complete MediSaver knowledge base (all prices, providers, plans)
✅ Lead capture with name/email/phone/type
✅ CSV lead export (/api/leads/export)
✅ Analytics dashboard (messages, sessions, intents)
✅ Human escalation with contact details
✅ Conversation history saved to disk
✅ Group plan flow
✅ Pharmacy card info
✅ Fallback responses (works without API key)
✅ Mobile responsive

## API Endpoints

- `POST /api/chat` — AI chat
- `POST /api/leads` — Capture lead
- `GET /api/leads/export` — Download leads CSV
- `GET /api/analytics` — View analytics
- `GET /api/conversation/:sessionId` — Conversation history

## Files

- `server.js` — Node.js backend with AI, leads, analytics
- `public/index.html` — Complete frontend (single file)
- `leads.json` — Auto-created, stores all leads
- `analytics.json` — Auto-created, stores analytics
- `conversations.json` — Auto-created, stores chat history

## Deploy to Production

1. Set ANTHROPIC_API_KEY environment variable
2. Use PM2: `pm2 start server.js --name medisaver-chatbot`
3. Or deploy to Railway/Render/Heroku

## Embed on Website

Add this to any website page:
```html
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-chatbot-domain.com';
  iframe.style = 'position:fixed;bottom:0;right:0;width:420px;height:700px;border:none;z-index:9999;';
  document.body.appendChild(iframe);
</script>
```