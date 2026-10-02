const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-list',
  description: 'Displays the concerned channels',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-list',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-list');
  }
};
