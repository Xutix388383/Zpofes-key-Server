const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

function send(payload) {
  if (!WEBHOOK_URL) return;
  return axios.post(WEBHOOK_URL, payload).catch(err => {
    console.error('Webhook log failed:', err.response?.data || err.message);
  });
}

module.exports = {
  // Basic text log
  logText: async function (message) {
    return send({ content: message });
  },

  // Script execution log
  logExecution: async function (hostname = 'Unknown Host') {
    const timestamp = new Date().toISOString();
    return send({
      embeds: [{
        title: '🟢 Script Executed',
        fields: [
          { name: 'Host', value: hostname, inline: true },
          { name: 'Timestamp', value: timestamp, inline: false }
        ],
        color: 0x00ff00
      }]
    });
  },

  // Key attempt log
  logKeyAttempt: async function (key, hwid = 'Unknown HWID') {
    const timestamp = new Date().toISOString();
    return send({
      embeds: [{
        title: '🔐 Key Attempt',
        fields: [
          { name: 'Key', value: `\`${key}\``, inline: true },
          { name: 'HWID', value: hwid, inline: true },
          { name: 'Timestamp', value: timestamp, inline: false }
        ],
        color: 0xffcc00
      }]
    });
  }
};
