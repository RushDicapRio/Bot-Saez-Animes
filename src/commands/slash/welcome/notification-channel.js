const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-channel',
  description: 'Defines the living room',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-channel');
  }
};
