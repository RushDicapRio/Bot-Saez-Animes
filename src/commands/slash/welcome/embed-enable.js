const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-enable',
  description: 'Enables the welcome embed',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-enable');
  }
};
