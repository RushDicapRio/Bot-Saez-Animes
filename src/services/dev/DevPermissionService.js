const config = require('../../config');
const dbManager = require('../../utils/database');
class DevPermissionService {
  /**
   * @param {string} userId 
   * @param {import('discord.js').Client} client 
   * @returns {boolean}
   */
  static isPrimaryOwner(userId, client) {
    if (!userId) return false;
    if (config.ownerIds && config.ownerIds.length && config.ownerIds[0] === userId) {
      return true;
    }
    const appOwner = client?.application?.owner;
    if (appOwner) {
      if (appOwner.id === userId) return true;
      if (appOwner.ownerId === userId) return true; 
    }
    return false;
  }
  /**
   * @param {string} userId 
   * @param {import('discord.js').Client} client 
   * @returns {boolean}
   */
  static isDeveloper(userId, client) {
    if (!userId) return false;
    if (config.ownerIds && config.ownerIds.includes(userId)) {
      return true;
    }
    const appOwner = client?.application?.owner;
    if (appOwner) {
      if (appOwner.id === userId) return true;
      if (appOwner.members && appOwner.members.has(userId)) return true;
    }
    return dbManager.isDevInWhitelist(userId);
  }
  /**
   * @param {string} targetUserId 
   * @param {string} addedByUserId 
   * @param {string} [notes] 
   */
  static addDeveloper(targetUserId, addedByUserId, notes = '') {
    dbManager.addDevWhitelist(targetUserId, addedByUserId, notes);
    return true;
  }
  /**
   * @param {string} targetUserId 
   * @param {string} removedByUserId 
   * @param {import('discord.js').Client} client 
   */
  static removeDeveloper(targetUserId, removedByUserId, client) {
    if (this.isPrimaryOwner(targetUserId, client)) {
      throw new Error("Cannot revoke the bot's primary owner !");
    }
    if (config.ownerIds.includes(targetUserId)) {
      throw new Error("This user is configured in the .env file (OWNER_IDS) and can only be removed via that file.");
    }
    dbManager.removeDevWhitelist(targetUserId);
    return true;
  }
  /**
   * @param {import('discord.js').Client} client 
   */
  static getDevelopers(client) {
    const list = [];
    const seen = new Set();
    for (const id of config.ownerIds) {
      if (!seen.has(id)) {
        seen.add(id);
        list.push({
          userId: id,
          source: 'CONFIG (.env)',
          isPrimary: this.isPrimaryOwner(id, client),
          addedAt: null
        });
      }
    }
    const appOwner = client?.application?.owner;
    if (appOwner) {
      if (appOwner.id && !seen.has(appOwner.id)) {
        seen.add(appOwner.id);
        list.push({
          userId: appOwner.id,
          source: 'DISCORD APP OWNER',
          isPrimary: true,
          addedAt: null
        });
      }
      if (appOwner.members) {
        for (const [memberId] of appOwner.members) {
          if (!seen.has(memberId)) {
            seen.add(memberId);
            list.push({
              userId: memberId,
              source: 'DISCORD TEAM MEMBER',
              isPrimary: false,
              addedAt: null
            });
          }
        }
      }
    }
    const dbDevs = dbManager.getDevWhitelist();
    for (const d of dbDevs) {
      if (!seen.has(d.user_id)) {
        seen.add(d.user_id);
        list.push({
          userId: d.user_id,
          source: 'DATABASE WHITELIST',
          isPrimary: false,
          addedBy: d.added_by,
          addedAt: d.added_at,
          notes: d.notes
        });
      }
    }
    return list;
  }
}
module.exports = DevPermissionService;
