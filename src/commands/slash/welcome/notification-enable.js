const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-enable',
  description: 'Turn on notifications',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-enable');
  }
};
