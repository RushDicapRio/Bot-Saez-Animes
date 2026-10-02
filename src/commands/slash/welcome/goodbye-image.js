const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'goodbye-image',
  description: 'Configures the goodbye image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'goodbye-image',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'goodbye-image');
  }
};
