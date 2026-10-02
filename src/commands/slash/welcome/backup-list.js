const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'backup-list',
  description: 'Displays the backups',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'backup-list',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'backup-list');
  }
};
