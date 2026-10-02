const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-list',
  description: 'Displays the available welcome messages',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-list',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-list');
  }
};
