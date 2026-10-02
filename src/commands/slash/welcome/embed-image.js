const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-image',
  description: 'Configures the welcome embed image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-image',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-image');
  }
};
