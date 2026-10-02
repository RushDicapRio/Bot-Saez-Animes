const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-reset',
  description: 'Resets the welcome channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-reset',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-reset');
  }
};
