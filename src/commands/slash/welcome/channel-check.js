const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-check',
  description: 'Checks the configured channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-check',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-check');
  }
};
