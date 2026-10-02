const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-footer',
  description: 'Configures the welcome embed footer',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-footer',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-footer');
  }
};
