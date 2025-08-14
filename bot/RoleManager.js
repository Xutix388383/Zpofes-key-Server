const { Client, GatewayIntentBits } = require('discord.js');

// Load .env only in local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
});

// Assign Zpofe Buyer role to a user
async function assignRole(discordId) {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(discordId);
    const role = guild.roles.cache.find(r => r.name === 'Zpofe Buyer');

    if (!role) throw new Error('Role "Zpofe Buyer" not found');
    await member.roles.add(role);

    return {
      success: true,
      message: `✅ Role assigned to ${member.user.tag}`,
      userTag: member.user.tag
    };
  } catch (err) {
    return {
      success: false,
      message: `❌ ${err.message}`,
      error: err.message
    };
  }
}

// Revoke Zpofe Buyer role from a user
async function revokeRole(discordId) {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(discordId);
    const role = guild.roles.cache.find(r => r.name === 'Zpofe Buyer');

    if (!role) throw new Error('Role "Zpofe Buyer" not found');
    await member.roles.remove(role);

    return {
      success: true,
      message: `✅ Role revoked from ${member.user.tag}`,
      userTag: member.user.tag
    };
  } catch (err) {
    return {
      success: false,
      message: `❌ ${err.message}`,
      error: err.message
    };
  }
}

module.exports = { assignRole, revokeRole };
