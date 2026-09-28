class DevCacheService {
  /**
   * @param {import('discord.js').Client} client 
   */
  static getStats(client) {
    let totalMessages = 0;
    let totalMembers = 0;
    let totalRoles = 0;
    let totalEmojis = 0;
    let totalStickers = 0;
    for (const guild of client.guilds.cache.values()) {
      totalMembers += guild.members.cache.size;
      totalRoles += guild.roles.cache.size;
      totalEmojis += guild.emojis.cache.size;
      totalStickers += guild.stickers.cache.size;
      for (const channel of guild.channels.cache.values()) {
        if (channel.messages && channel.messages.cache) {
          totalMessages += channel.messages.cache.size;
        }
      }
    }
    return {
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      members: totalMembers,
      roles: totalRoles,
      messages: totalMessages,
      emojis: totalEmojis,
      stickers: totalStickers
    };
  }
  /**
   * @param {import('discord.js').Client} client 
   */
  static clearVolatileCache(client) {
    let clearedMessages = 0;
    for (const guild of client.guilds.cache.values()) {
      for (const channel of guild.channels.cache.values()) {
        if (channel.messages && channel.messages.cache) {
          clearedMessages += channel.messages.cache.size;
          channel.messages.cache.clear();
        }
      }
    }
    return { clearedMessages };
  }
  /**
   * @param {import('discord.js').Client} client 
   * @param {string} query 
   */
  static search(client, query) {
    const q = query.toLowerCase();
    const results = {
      guilds: client.guilds.cache.filter(g => g.id === q || g.name.toLowerCase().includes(q)).map(g => ({ id: g.id, name: g.name, type: 'GUILD' })),
      channels: client.channels.cache.filter(c => c.id === q || (c.name && c.name.toLowerCase().includes(q))).map(c => ({ id: c.id, name: c.name, type: 'CHANNEL' })),
      users: client.users.cache.filter(u => u.id === q || u.username.toLowerCase().includes(q)).map(u => ({ id: u.id, name: u.username, type: 'USER' }))
    };
    return results;
  }
}
module.exports = DevCacheService;
