const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-change',
  description: 'Changes the welcome channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-change',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-change');
  }
};
