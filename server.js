const express = require('express');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const { sendWebhookLog } = require('./webhook-api');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = 'ZPOFES-ADMIN-ACCESS'; // 🔐 Change this to a secure value

let keys = require('./keys.json');

// ✅ Verify key and HWID
app.post('/verify', (req, res) => {
  const { key, hwid } = req.body;
  if (!key || !hwid) return res.status(400).json({ success: false, message: 'Missing key or HWID' });

  const stored = keys[key];
  if (!stored) {
    sendWebhookLog(`❌ Invalid key attempt: ${key}`);
    return res.status(403).json({ success: false, message: 'Invalid key' });
  }

  if (stored.hwid && stored.hwid !== hwid) {
    sendWebhookLog(`❌ HWID mismatch for key: ${key}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch' });
  }

  if (!stored.hwid) {
    keys[key].hwid = hwid;
    fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));
    sendWebhookLog(`✅ HWID bound for key: ${key}`);
  }

  res.json({ success: true, message: 'Key verified' });
});

// 🔄 Reset HWID (admin-only)
app.post('/reset', (req, res) => {
  const { key, secret } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ success: false, message: 'Unauthorized' });

  if (!keys[key]) return res.status(404).json({ success: false, message: 'Key not found' });

  keys[key].hwid = null;
  fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));
  sendWebhookLog(`🔄 HWID reset for key: ${key}`);
  res.json({ success: true, message: 'HWID reset' });
});

// 🧬 Generate new key (admin-only)
app.post('/generate', (req, res) => {
  const { secret } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ success: false, message: 'Unauthorized' });

  const newKey = crypto.randomBytes(10).toString('hex').toUpperCase();
  keys[newKey] = { hwid: null };
  fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));
  sendWebhookLog(`🧬 New key generated: ${newKey}`);
  res.json({ success: true, key: newKey });
});

// 📊 Key status lookup
app.get('/status/:key', (req, res) => {
  const key = req.params.key;
  const data = keys[key];
  if (!data) return res.status(404).json({ success: false, message: 'Key not found' });

  res.json({ success: true, hwid: data.hwid || null });
});

// 🧪 Health check
app.get('/', (req, res) => {
  res.send('Zpofes Key Server is running.');
});

app.listen(PORT, () => console.log(`✅ Zpofes Key Server running on port ${PORT}`));
