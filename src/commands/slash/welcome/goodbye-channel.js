const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'goodbye-channel',
  description: 'Configures the goodbye channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'goodbye-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'goodbye-channel');
  }
};
