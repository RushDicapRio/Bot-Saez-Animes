const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-return',
  description: 'Return notification',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-return',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-return');
  }
};
