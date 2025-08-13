const express = require('express');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(express.json());
app.use(cors());

const KEYS_FILE = './keys.json';

// 🔄 Load keys from file
function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// 💾 Save keys to file
function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// 📡 Discord webhook logger
function sendWebhookLog(message) {
  if (!WEBHOOK_URL) return;
  axios.post(WEBHOOK_URL, { content: message }).catch(() => {});
}

// ✅ Verify key and HWID
app.post('/verify', (req, res) => {
  const { key, hwid, bind } = req.body;
  if (!key || !hwid) return res.status(400).json({ success: false, message: 'Missing key or HWID' });

  const keys = loadKeys();
  const stored = keys[key];

  if (!stored) {
    sendWebhookLog(`❌ Invalid key attempt: ${key}`);
    return res.status(403).json({ success: false, message: 'Invalid key' });
  }

  if (stored.hwid && stored.hwid !== hwid) {
    sendWebhookLog(`❌ HWID mismatch for key: ${key}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch' });
  }

  if (!stored.hwid && bind === true) {
    stored.hwid = hwid;
    keys[key] = stored;
    saveKeys(keys);
    sendWebhookLog(`✅ HWID bound for key: ${key}`);
    return res.json({ success: true, message: 'HWID bound and authorized.' });
  }

  sendWebhookLog(`✅ Key verified: ${key}`);
  return res.json({ success: true, message: 'Authorized.' });
});

// 🧬 Generate key and save to file
app.post('/genkey', (req, res) => {
  const keys = loadKeys();
  const newKey = crypto.randomBytes(10).toString('hex').toUpperCase();
  keys[newKey] = { hwid: null };
  saveKeys(keys);
  sendWebhookLog(`🧬 Key generated: ${newKey}`);
  res.json({ success: true, key: newKey });
});

// 🧪 Health check
app.get('/', (req, res) => {
  res.send('Zpofes Key Server is running.');
});

app.listen(PORT, () => console.log(`✅ Zpofes Key Server running on port ${PORT}`));
