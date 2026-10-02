const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-timestamp',
  description: 'Configures the welcome embed timestamp',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-timestamp',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-timestamp');
  }
};
