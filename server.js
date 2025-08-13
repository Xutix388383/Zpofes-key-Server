const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(express.json());
app.use(cors());

let keys = {};
try {
  keys = JSON.parse(fs.readFileSync('./keys.json'));
} catch {
  keys = {};
}

function sendWebhookLog(message) {
  if (!WEBHOOK_URL) return;
  axios.post(WEBHOOK_URL, { content: message }).catch(() => {});
}

app.post('/genkey', (req, res) => {
  const newKey = crypto.randomBytes(10).toString('hex').toUpperCase();
  keys[newKey] = { hwid: null };
  fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));
  sendWebhookLog(`🧬 Key generated: \`${newKey}\``);
  res.json({ success: true, key: newKey });
});

app.get('/', (req, res) => {
  res.send('Zpofes Key Server is running.');
});

app.listen(PORT, () => console.log(`✅ Server live on port ${PORT}`));
