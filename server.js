const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔗 Webhook URL (replace with your actual Discord webhook)
const WEBHOOK_URL = 'https://discord.com/api/webhooks/your_webhook_id';

// 📡 Send logs to Discord
function sendWebhookLog(message) {
  axios.post(WEBHOOK_URL, {
    content: message
  }).catch(err => console.error('Webhook error:', err.message));
}

// 🛠 Health check
app.get('/', (req, res) => {
  res.send('✅ Zpofes Backend is running.');
});

// 🔍 Key status endpoint
app.get('/status/:key', (req, res) => {
  const keyParam = req.params.key;
  const raw = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
  const keys = raw.keys || [];
  const match = keys.find(k => k.key === keyParam);

  if (!match) {
    sendWebhookLog(`🔍 Status check: Invalid key ${keyParam}`);
    return res.status(404).json({ success: false, message: 'Key not found.' });
  }

  const now = new Date();
  const expiresAt = match.expiresAt ? new Date(match.expiresAt) : null;
  const expired = expiresAt && expiresAt < now;

  const status = {
    key: match.key,
    type: match.type || "unknown",
    created: match.created || "unknown",
    expiresAt: match.expiresAt || "none",
    expired: expired,
    hwid: match.hwid || null
  };

  sendWebhookLog(`🔍 Status check: ${keyParam} → ${expired ? "Expired" : "Valid"}`);
  return res.json({ success: true, status });
});

// 🔐 Key verification endpoint
app.post('/verify', (req, res) => {
  const { key, hwid } = req.body;
  if (!key || !hwid) {
    return res.status(400).json({ success: false, message: 'Missing key or HWID.' });
  }

  const raw = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
  const keys = raw.keys || [];
  const match = keys.find(k => k.key === key);

  if (!match) {
    sendWebhookLog(`❌ Invalid key attempt: ${key}`);
    return res.status(403).json({ success: false, message: 'Invalid key.' });
  }

  const now = new Date();
  const expiresAt = match.expiresAt ? new Date(match.expiresAt) : null;
  if (expiresAt && expiresAt < now) {
    sendWebhookLog(`⌛ Expired key used: ${key}`);
    return res.status(403).json({ success: false, message: 'Key expired.' });
  }

  if (match.hwid && match.hwid !== hwid) {
    sendWebhookLog(`🔐 HWID mismatch: ${key} → ${hwid}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch.' });
  }

  if (!match.hwid) {
    match.hwid = hwid;
    fs.writeFileSync('./keys.json', JSON.stringify({ keys }, null, 2));
    sendWebhookLog(`🔐 HWID bound: ${key} → ${hwid}`);
  }

  sendWebhookLog(`✅ Verified: ${key} → ${hwid}`);
  return res.json({ success: true, message: 'Key verified.', type: match.type || "unknown" });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Zpofes backend running on port ${PORT}`);
});
