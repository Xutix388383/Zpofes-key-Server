// bot/roleManager.js
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.login(process.env.DISCORD_BOT_TOKEN);

async function assignRole(discordId) {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId);
    const role = guild.roles.cache.find(r => r.name === 'Zpofe Buyer');

    if (!role) throw new Error('Role "Zpofe Buyer" not found');

    await member.roles.add(role);
    return { success: true, message: `✅ Role assigned to ${member.user.tag}` };
  } catch (err) {
    return { success: false, message: `❌ ${err.message}` };
  }
}

module.exports = { assignRole };
