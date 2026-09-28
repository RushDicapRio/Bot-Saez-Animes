require('dotenv').config();
const config = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '', 
  prefix: process.env.PREFIX || '!',
  streamUrl: process.env.STREAM_URL || 'https://www.twitch.tv/saez924',
  statusText: process.env.STATUS_TEXT || '',
  ownerIds: (process.env.OWNER_IDS || process.env.OWNER_ID || '').split(',').map(id => id.trim()).filter(Boolean),
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    danger: 0xED4245,
    warning: 0xFEE75C,
    dev: 0x9B59B6 
  },
  /**
   * @param {string} userId 
   * @param {import('discord.js').Client} client 
   * @returns {boolean}
   */
  isDev(userId, client) {
    if (this.ownerIds.includes(userId)) return true;
    const appOwner = client?.application?.owner;
    if (appOwner) {
      if (appOwner.id === userId) return true;
      if (appOwner.members && appOwner.members.has(userId)) return true;
    }
    return false;
  }
};
if (!config.token) {
  console.error("❌ ERROR: The bot token is not defined in the .env file (DISCORD_TOKEN)!");
}
module.exports = config;
