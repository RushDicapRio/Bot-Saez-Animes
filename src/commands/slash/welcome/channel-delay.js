const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-delay',
  description: 'Sets the access delay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-delay',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-delay');
  }
};
