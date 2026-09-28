const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const { loadEvents } = require('./handlers/eventHandler');
const { loadSlashCommands } = require('./handlers/slashCommandHandler');
const { loadPrefixCommands } = require('./handlers/prefixCommandHandler');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.aliases = new Collection();
console.log('⚡ Initializing bot...');
loadSlashCommands(client);
loadPrefixCommands(client);
loadEvents(client);
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UnhandledRejection]', reason);
});
process.on('uncaughtException', (err, origin) => {
  console.error('❌ [UncaughtException]', err, origin);
});
client.login(config.token);
