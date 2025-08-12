require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const keys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));

app.get('/', (req, res) => {
  res.send('🔐 Zpofes Key Server is live.');
});

app.post('/verify', (req, res) => {
  const { key } = req.body;
  if (keys.includes(key)) {
    res.json({ success: true, message: '✅ Key is valid' });
  } else {
    res.status(403).json({ success: false, message: '❌ Invalid key' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zpofes Key Server running on port ${PORT}`);
});
