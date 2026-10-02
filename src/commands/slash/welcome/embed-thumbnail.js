const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-thumbnail',
  description: 'Configures the welcome embed thumbnail',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-thumbnail',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-thumbnail');
  }
};
