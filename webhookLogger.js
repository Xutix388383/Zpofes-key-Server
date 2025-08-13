const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

module.exports.log = async function (message) {
  if (!WEBHOOK_URL) return;

  try {
    await axios.post(WEBHOOK_URL, {
      content: message
    });
  } catch (err) {
    console.error('Webhook log failed:', err.message);
  }
};
