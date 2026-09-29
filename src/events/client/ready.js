const { Events, ActivityType } = require('discord.js');
const { registerSlashCommands } = require('../../handlers/slashCommandHandler');
const config = require('../../config');
module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`\n========================================`);
    console.log(`🚀 Successfully connected as : ${client.user.tag}`);
    console.log(`📌 Current prefix : ${config.prefix}`);
    console.log(`🌐 Present on ${client.guilds.cache.size} server(s)`);
    await client.application.fetch().catch(() => {});
    console.log(`========================================\n`);
    const activityName = config.statusText || `Check out Saez Animes`;
    client.user.setPresence({
      activities: [
        {
          name: activityName,
          type: ActivityType.Streaming,
          url: config.streamUrl
        }
      ],
      status: 'online'
    });
    await registerSlashCommands(client);
    const GiveawayService = require('../../services/giveaway/GiveawayService');
    GiveawayService.initScheduler(client);
    const ReminderService = require('../../services/reminders/ReminderService');
    ReminderService.initScheduler(client);
  }
};
