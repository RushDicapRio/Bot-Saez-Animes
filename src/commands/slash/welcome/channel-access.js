const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-access',
  description: 'Configures access to channels',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-access',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-access');
  }
};
