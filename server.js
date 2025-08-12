// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const KEYS_FILE = './keys.json';

// Utility: Load keys
function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return {};
  return JSON.parse(fs.readFileSync(KEYS_FILE));
}

// Utility: Save keys
function saveKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}

// Utility: Generate random key
function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

// Endpoint: Verify key + HWID
app.post('/verify', (req, res) => {
  const { key, hwid } = req.body;
  const keys = loadKeys();

  if (!keys[key]) return res.status(403).json({ success: false, message: 'Invalid key' });

  if (!keys[key].hwid) {
    keys[key].hwid = hwid;
    saveKeys(keys);
    return res.json({ success: true, message: 'HWID bound' });
  }

  if (keys[key].hwid !== hwid) {
    return res.status(403).json({ success: false, message: 'HWID mismatch' });
  }

  res.json({ success: true, message: 'Verified' });
});

// Endpoint: Generate new key
app.post('/genkey', (req, res) => {
  const newKey = generateKey();
  const keys = loadKeys();
  keys[newKey] = { hwid: null };
  saveKeys(keys);
  res.json({ success: true, key: newKey });
});

// Endpoint: Reset HWID
app.post('/resethwid', (req, res) => {
  const { key } = req.body;
  const keys = loadKeys();

  if (!keys[key]) return res.status(404).json({ success: false, message: 'Key not found' });

  keys[key].hwid = null;
  saveKeys(keys);
  res.json({ success: true, message: 'HWID reset' });
});

// Endpoint: Delete key
app.post('/deletekey', (req, res) => {
  const { key } = req.body;
  const keys = loadKeys();

  if (!keys[key]) return res.status(404).json({ success: false, message: 'Key not found' });

  delete keys[key];
  saveKeys(keys);
  res.json({ success: true, message: 'Key deleted' });
});

// Endpoint: Stats
app.get('/stats', (req, res) => {
  const keys = loadKeys();
  const total = Object.keys(keys).length;
  const bound = Object.values(keys).filter(k => k.hwid).length;
  const unbound = total - bound;

  res.json({ total, bound, unbound });
});

app.listen(PORT, () => {
  console.log(`Zpofes Key Server running on port ${PORT}`);
});
