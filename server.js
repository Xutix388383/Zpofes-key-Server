const express = require('express');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Load keys from JSON
const keys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiter (optional stealth)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP
});
app.use(limiter);

// 🔍 Verify key endpoint
app.post('/verify', (req, res) => {
  const { key, hwid } = req.body;

  if (!key) return res.status(400).json({ success: false, message: 'No key provided.' });

  const match = keys.find(k => k.key === key);

  if (!match) {
    return res.status(403).json({ success: false, message: 'Invalid key.' });
  }

  // Optional HWID binding
  if (match.hwid && match.hwid !== hwid) {
    return res.status(403).json({ success: false, message: 'HWID mismatch.' });
  }

  // Bind HWID if not already bound
  if (!match.hwid && hwid) {
    match.hwid = hwid;
    fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));
  }

  return res.json({ success: true, message: 'Key verified.', hwid: hwid || null });
});

// 🧪 Health check
app.get('/', (req, res) => {
  res.send('Zpofes Key Server is running.');
});

app.listen(PORT, () => {
  console.log(`✅ Zpofes Key Server running on port ${PORT}`);
});
