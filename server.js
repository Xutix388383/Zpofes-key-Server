const fs = require('fs');

app.post('/verify', (req, res) => {
  const { key, hwid, bind } = req.body;
  if (!key || !hwid) return res.status(400).json({ success: false, message: 'Missing key or HWID' });

  const raw = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
  const keys = raw.keys || [];
  const match = keys.find(k => k.key === key);

  if (!match) {
    sendWebhookLog(`❌ Invalid key attempt: ${key}`);
    return res.status(403).json({ success: false, message: 'Key not recognized.' });
  }

  // ⏳ Expiry check
  if (match.expiresAt && new Date(match.expiresAt) < new Date()) {
    sendWebhookLog(`❌ Expired key attempt: ${key}`);
    return res.status(403).json({ success: false, message: 'Key expired.' });
  }

  // 🔐 HWID binding
  if (!match.hwid && bind === true) {
    match.hwid = hwid;
    fs.writeFileSync('./keys.json', JSON.stringify({ keys }, null, 2));
    sendWebhookLog(`✅ HWID bound for key: ${key}`);
    return res.json({ success: true, message: 'HWID bound and authorized.' });
  }

  if (match.hwid && match.hwid !== hwid) {
    sendWebhookLog(`❌ HWID mismatch for key: ${key}`);
    return res.status(403).json({ success: false, message: 'HWID mismatch.' });
  }

  sendWebhookLog(`✅ Key verified: ${key}`);
  return res.json({ success: true, message: 'Authorized.' });
});
