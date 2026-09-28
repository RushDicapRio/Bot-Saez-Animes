const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
/**
 * @param {string} title 
 * @param {string} [description] 
 * @returns {EmbedBuilder}
 */
function createDevEmbed(title, description = '') {
  const embed = new EmbedBuilder()
    .setColor(config.colors.dev || 0x9B59B6)
    .setTitle(`🛠️ ${title}`)
    .setTimestamp();
  if (description) {
    embed.setDescription(description);
  }
  return embed;
}
/**
 * @param {'success'|'warning'|'danger'|'info'} type 
 * @param {string} title 
 * @param {string} message 
 * @returns {EmbedBuilder}
 */
function createStatusEmbed(type, title, message) {
  const colorMap = {
    success: config.colors.success || 0x57F287,
    warning: config.colors.warning || 0xFEE75C,
    danger: config.colors.danger || 0xED4245,
    info: config.colors.primary || 0x5865F2
  };
  const iconMap = {
    success: '✅',
    warning: '⚠️',
    danger: '❌',
    info: 'ℹ️'
  };
  return new EmbedBuilder()
    .setColor(colorMap[type] || config.colors.dev)
    .setTitle(`${iconMap[type] || '🔹'} ${title}`)
    .setDescription(message)
    .setTimestamp();
}
/**
 * @param {string} title 
 * @param {Error|string} error 
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(title, error) {
  const msg = error instanceof Error ? (error.stack || error.message) : String(error);
  return new EmbedBuilder()
    .setColor(config.colors.danger || 0xED4245)
    .setTitle(`❌ ${title}`)
    .setDescription(`\`\`\`js\n${msg.substring(0, 1900)}\n\`\`\``)
    .setTimestamp();
}
module.exports = {
  createDevEmbed,
  createStatusEmbed,
  createErrorEmbed
};
