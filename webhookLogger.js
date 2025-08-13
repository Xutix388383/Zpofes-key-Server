const axios = require('axios');
require('dotenv').config();

const logToDiscord = async (message) => {
  try {
    await axios.post(process.env.WEBHOOK_URL, {
      content: message
    });
  } catch (err) {
    console.error('Discord logging failed:', err.message);
  }
};

module.exports = { logToDiscord };
