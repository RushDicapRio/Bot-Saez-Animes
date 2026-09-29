const fs = require('fs');
const path = require('path');
/**
 * @param {import('discord.js').Client} client 
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  if (!fs.existsSync(eventsPath)) return;
  const folders = fs.readdirSync(eventsPath);
  let eventCount = 0;
  for (const folder of folders) {
    const folderPath = path.join(eventsPath, folder);
    const stat = fs.statSync(folderPath);
    const files = stat.isDirectory()
      ? fs.readdirSync(folderPath).filter(file => file.endsWith('.js')).map(file => path.join(folderPath, file))
      : (folder.endsWith('.js') ? [folderPath] : []);
    for (const filePath of files) {
      const event = require(filePath);
      if (!event.name) {
        console.warn(`⚠️ [EventHandler] The event in "${filePath}" does not have a "name" property defined.`);
        continue;
      }
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      eventCount++;
    }
  }
  console.log(`✅ [Events] ${eventCount} Event(s) loaded.`);
}
module.exports = { loadEvents };
