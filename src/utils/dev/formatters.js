const config = require('../../config');
/**
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
/**
 * @param {number} input 
 * @param {boolean} isMs 
 * @returns {string}
 */
function formatDuration(input, isMs = false) {
  let seconds = isMs ? Math.floor(input / 1000) : Math.floor(input);
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remSec = seconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${remSec}s`);
  return parts.join(' ');
}
/**
 * @param {number} ms 
 * @returns {string}
 */
function formatLatency(ms) {
  if (ms < 0 || isNaN(ms)) return '`Calculation in progress...`';
  let badge = '🟢';
  if (ms > 350) badge = '🔴';
  else if (ms > 150) badge = '🟡';
  return `${badge} \`${ms.toFixed ? ms.toFixed(1) : ms} ms\``;
}
/**
 * @param {string} text 
 * @param {string[]} additionalSecrets 
 * @returns {string}
 */
function sanitizeSecrets(text, additionalSecrets = []) {
  if (typeof text !== 'string') text = String(text);
  const secrets = [
    config.token,
    process.env.DISCORD_TOKEN,
    process.env.TOKEN,
    ...additionalSecrets
  ].filter(Boolean);
  let sanitized = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 8) {
      sanitized = sanitized.replaceAll(secret, '[REDACTED_SECRET]');
    }
  }
  sanitized = sanitized.replace(/[MNO][a-zA-Z\d_-]{23,25}\.[a-zA-Z\d_-]{6}\.[a-zA-Z\d_-]{27,}/g, '[REDACTED_DISCORD_TOKEN]');
  return sanitized;
}
/**
 * @param {string} str 
 * @param {number} max 
 * @returns {string}
 */
function truncate(str, max = 1000) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.substring(0, max - 3) + '...';
}
module.exports = {
  formatBytes,
  formatDuration,
  formatLatency,
  sanitizeSecrets,
  truncate
};
