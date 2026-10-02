const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-disable',
  description: 'Turn off notifications',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-disable');
  }
};
