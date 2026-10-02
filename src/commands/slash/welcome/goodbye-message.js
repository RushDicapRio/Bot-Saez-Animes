const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'goodbye-message',
  description: 'Configures the goodbye message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'goodbye-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'goodbye-message');
  }
};
