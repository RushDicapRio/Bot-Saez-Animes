const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'goodbye-embed',
  description: 'Configures the goodbye embed',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'goodbye-embed',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'goodbye-embed');
  }
};
