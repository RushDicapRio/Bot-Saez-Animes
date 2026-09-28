const { EmbedBuilder } = require('discord.js');
const dbManager = require('./database');
const config = require('../config');
const channelConsecutiveMap = new Map();
const RESET_INACTIVITY_MS = 25 * 1000;
const MIN_INTERVAL_MS = 1000;
/**
 * @param {number} level
 * @returns {number}
 */
function xpNeededForNextLevel(level) {
  return 5 * (level ** 2) + (50 * level) + 100;
}
/**
 * @param {number} level 
 * @returns {number}
 */
function totalXpForLevel(level) {
  let total = 0;
  for (let l = 0; l < level; l++) {
    total += xpNeededForNextLevel(l);
  }
  return total;
}
/**
 * @param {number} totalXp
 */
function getLevelData(totalXp) {
  let level = 0;
  let accumulated = 0;
  while (true) {
    const needed = xpNeededForNextLevel(level);
    if (accumulated + needed > totalXp) {
      const currentLevelXp = totalXp - accumulated;
      const progressPercentage = Math.min(100, Math.max(0, Math.floor((currentLevelXp / needed) * 100)));
      return {
        level,
        totalXp,
        currentLevelXp,
        xpNeededForNext: needed,
        progressPercentage
      };
    }
    accumulated += needed;
    level++;
  }
}
/**
 * @param {number} current 
 * @param {number} max 
 * @param {number} size 
 * @returns {string}
 */
function createProgressBar(current, max, size = 12) {
  const percentage = Math.min(1, Math.max(0, current / max));
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  const filledBar = '█'.repeat(progress);
  const emptyBar = '░'.repeat(emptyProgress);
  return `[${filledBar}${emptyBar}] ${Math.floor(percentage * 100)}%`;
}
/**
 * @param {import('discord.js').Message} message 
 */
async function handleMessageXp(message) {
  if (!message.guild || message.author.bot) return;
  const guildId = message.guild.id;
  const userId = message.author.id;
  const channelId = message.channel.id;
  const now = Date.now();
  const settings = dbManager.getGuildSettings(guildId);
  if (!settings.enabled) return;
  let channelState = channelConsecutiveMap.get(channelId);
  if (!channelState) {
    channelState = {
      lastUserId: userId,
      consecutiveCount: 1,
      lastTimestamp: now
    };
    channelConsecutiveMap.set(channelId, channelState);
  } else {
    if (channelState.lastUserId === userId) {
      if (now - channelState.lastTimestamp < MIN_INTERVAL_MS) {
        return;
      }
      if (now - channelState.lastTimestamp > RESET_INACTIVITY_MS) {
        channelState.consecutiveCount = 1;
      } else {
        channelState.consecutiveCount += 1;
      }
    } else {
      channelState.lastUserId = userId;
      channelState.consecutiveCount = 1;
    }
    channelState.lastTimestamp = now;
    channelConsecutiveMap.set(channelId, channelState);
  }
  if (channelState.consecutiveCount > 3) {
    return;
  }
  const randomXp = Math.floor(Math.random() * 11) + 15;
  const finalXpGain = Math.round(randomXp * (settings.xp_rate || 1.0));
  const userData = dbManager.getUser(guildId, userId);
  const newTotalXp = userData.xp + finalXpGain;
  const oldLevel = userData.level;
  const levelInfo = getLevelData(newTotalXp);
  const newLevel = levelInfo.level;
  dbManager.updateUser(guildId, userId, newTotalXp, newLevel);
  if (newLevel > oldLevel) {
    await sendLevelUpMessage(message, settings, newLevel, newTotalXp, levelInfo);
  }
}
async function sendLevelUpMessage(message, settings, newLevel, newTotalXp, levelInfo) {
  const targetChannelId = settings.levelup_channel_id;
  const channel = (targetChannelId && message.guild.channels.cache.get(targetChannelId)) || message.channel;
  if (!channel || !channel.isTextBased()) return;
  const formattedText = settings.levelup_message
    .replace(/{user}/g, `<@${message.author.id}>`)
    .replace(/{username}/g, message.author.username)
    .replace(/{level}/g, newLevel.toString())
    .replace(/{xp}/g, newTotalXp.toString())
    .replace(/{server}/g, message.guild.name);
  try {
    if (settings.levelup_embed) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🎉 Level up !')
        .setDescription(formattedText)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🎖️ New Level', value: `\`Niveau ${newLevel}\``, inline: true },
          { name: '✨ Total XP', value: `\`${newTotalXp} XP\``, inline: true },
          { name: '🎯 Next Goal', value: `\`${levelInfo.xpNeededForNext - levelInfo.currentLevelXp} Remaining XP\``, inline: true }
        )
        .setFooter({ text: `Developed with ❤️ by Saez | ${message.guild.name} • Leveling System` })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send(formattedText);
    }
  } catch (err) {
    console.error('❌ Error sending the level-up message :', err);
  }
}
module.exports = {
  xpNeededForNextLevel,
  totalXpForLevel,
  getLevelData,
  createProgressBar,
  handleMessageXp
};
