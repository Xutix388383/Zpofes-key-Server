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

function saveKeys(keys) {
  fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));
}

// ✅ Verify key
app.get('/verify', (req, res) => {
  const { key, hwid } = req.query;
  const keys = loadKeys();

  if (!key || !hwid) return res.status(400).json({ success: false, message: 'Missing key or HWID' });

  const entry = keys[key];
  if (!entry) {
    webhookLogger.log(`❌ Invalid key attempt: ${key} | HWID: ${hwid}`);
    return res.status(403).json({ success: false, message: 'Invalid key' });
  }

  if (entry.hwid && entry.hwid !== hwid) {
    webhookLogger.log(`⚠️ HWID mismatch: ${key} | Expected: ${entry.hwid}, Got: ${hwid}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch' });
  }

  if (!entry.hwid) {
    entry.hwid = hwid;
    saveKeys(keys);
    webhookLogger.log(`🔐 HWID bound: ${key} → ${hwid}`);
  }

  webhookLogger.log(`✅ Verified: ${key} | HWID: ${hwid}`);
  res.json({ success: true, message: 'Key verified' });
});

// 🧠 Key status
app.get('/status/:key', (req, res) => {
  const keys = loadKeys();
  const entry = keys[req.params.key];
  if (!entry) return res.status(404).json({ success: false, message: 'Key not found' });

  res.json({
    success: true,
    hwid: entry.hwid || null,
    createdAt: entry.createdAt || null,
    temp: entry.temp || false
  });
});

// 🆕 Generate key
app.post('/genkey', (req, res) => {
  const keys = loadKeys();
  const temp = req.query.temp === 'true';
  const newKey = `ZPOFES-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

  keys[newKey] = {
    hwid: null,
    createdAt: Date.now(),
    temp
  };

  saveKeys(keys);
  webhookLogger.log(`🆕 Key generated: ${newKey} ${temp ? '(TEMP)' : ''}`);
  res.json({ success: true, key: newKey });
});

// 🔄 Reset HWID
app.post('/reset', (req, res) => {
  const { key } = req.body;
  const keys = loadKeys();
  const entry = keys[key];
  if (!entry) return res.status(404).json({ success: false, message: 'Key not found' });

  entry.hwid = null;
  saveKeys(keys);
  webhookLogger.log(`🔄 HWID reset: ${key}`);
  res.json({ success: true, message: 'HWID reset' });
});

// ❌ Delete key
app.post('/delete', (req, res) => {
  const { key } = req.body;
  const keys = loadKeys();
  if (!keys[key]) return res.status(404).json({ success: false, message: 'Key not found' });

  delete keys[key];
  saveKeys(keys);
  webhookLogger.log(`❌ Key deleted: ${key}`);
  res.json({ success: true, message: 'Key deleted' });
});

// 🧹 Cleanup expired temp keys
app.post('/cleanup', (req, res) => {
  const keys = loadKeys();
  const now = Date.now();
  const expired = [];

  for (const [key, entry] of Object.entries(keys)) {
    if (entry.temp && entry.createdAt && now - entry.createdAt > 3600000) { // 1 hour
      delete keys[key];
      expired.push(key);
    }
  }

  saveKeys(keys);
  webhookLogger.log(`🧹 Temp keys cleaned: ${expired.join(', ') || 'None'}`);
  res.json({ success: true, cleaned: expired });
});

// ⏱️ Check key age
app.get('/checktime/:key', (req, res) => {
  const keys = loadKeys();
  const entry = keys[req.params.key];
  if (!entry || !entry.createdAt) return res.status(404).json({ success: false, message: 'Key not found or missing timestamp' });

  const ageMs = Date.now() - entry.createdAt;
  res.json({ success: true, ageMs });
});

// 📋 List all keys
app.get('/list', (req, res) => {
  const keys = loadKeys();
  res.json({ success: true, keys });
});

app.listen(PORT, () => {
  console.log(`Zpofes Key Server running on port ${PORT}`);
});
