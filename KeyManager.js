const fs = require('fs');
const path = require('path');
const keysPath = path.join(__dirname, 'keys.json');

function loadKeys() {
  try {
    return JSON.parse(fs.readFileSync(keysPath));
  } catch {
    return {};
  }
}

function saveKeys(keys) {
  fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));
}

function createKey({ type = 'perm', createdBy = 'bot' }) {
  const keys = loadKeys();
  const newKey = `ZPOFES-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  keys[newKey] = {
    type,
    createdAt: Date.now(),
    createdBy,
    hwid: null,
    redeemed: false
  };
  saveKeys(keys);
  return newKey;
}

function verifyKey(key) {
  const keys = loadKeys();
  return keys[key] && !keys[key].redeemed;
}

module.exports = { createKey, verifyKey };
