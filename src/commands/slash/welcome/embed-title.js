const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-title',
  description: 'Configures the welcome embed title',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-title',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-title');
  }
};
