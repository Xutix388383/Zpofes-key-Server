require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const webhookLogger = require('./webhookLogger');

const app = express();
const PORT = process.env.PORT || 3000;
const keysPath = path.join(__dirname, 'keys.json');

app.use(express.json());

function loadKeys() {
  try {
    const raw = fs.readFileSync(keysPath);
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load keys:', err);
    return {};
  }
}

app.get('/verify', (req, res) => {
  const { key, hwid } = req.query;
  const keys = loadKeys();

  if (!key || !hwid) {
    return res.status(400).json({ success: false, message: 'Missing key or HWID' });
  }

  const entry = keys[key];
  if (!entry) {
    webhookLogger.log(`❌ Invalid key attempt: ${key} | HWID: ${hwid}`);
    return res.status(403).json({ success: false, message: 'Invalid key' });
  }

  if (entry.hwid && entry.hwid !== hwid) {
    webhookLogger.log(`⚠️ HWID mismatch for key: ${key} | Expected: ${entry.hwid}, Got: ${hwid}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch' });
  }

  if (!entry.hwid) {
    entry.hwid = hwid;
    fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));
    webhookLogger.log(`🔐 HWID bound: ${key} → ${hwid}`);
  }

  webhookLogger.log(`✅ Verified: ${key} | HWID: ${hwid}`);
  res.json({ success: true, message: 'Key verified' });
});

app.get('/status/:key', (req, res) => {
  const keys = loadKeys();
  const entry = keys[req.params.key];

  if (!entry) return res.status(404).json({ success: false, message: 'Key not found' });

  res.json({ success: true, hwid: entry.hwid || null });
});

app.listen(PORT, () => {
  console.log(`Zpofes Key Server running on port ${PORT}`);
});
