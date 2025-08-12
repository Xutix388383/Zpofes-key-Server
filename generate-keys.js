const fs = require('fs');
const crypto = require('crypto');
const KEYS_FILE = './keys.json';
const keys = fs.existsSync(KEYS_FILE) ? JSON.parse(fs.readFileSync(KEYS_FILE)) : {};

function generateZpofesKey() {
  return 'ZP-' + crypto.randomBytes(12).toString('hex').toUpperCase().slice(0, 15);
}

for (let i = 0; i < 10; i++) {
  const key = generateZpofesKey();
  keys[key] = { hwid: null };
  console.log(`✅ Generated: ${key}`);
}

fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
console.log('🔐 All keys saved to keys.json');
