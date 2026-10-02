const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-lock',
  description: 'Locks the channels for new users',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-lock',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-lock');
  }
};
