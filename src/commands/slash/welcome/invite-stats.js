const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite-stats',
  description: 'Displays invitation statistics',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite-stats',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite-stats');
  }
};
