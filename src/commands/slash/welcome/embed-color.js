const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-color',
  description: 'Configures the welcome embed color',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-color',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-color');
  }
};
