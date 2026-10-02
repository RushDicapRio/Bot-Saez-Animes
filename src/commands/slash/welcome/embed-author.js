const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-author',
  description: 'Configures the welcome embed author',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-author',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-author');
  }
};
