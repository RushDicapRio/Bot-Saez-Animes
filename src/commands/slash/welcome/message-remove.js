const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-remove',
  description: 'Removes a custom welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-remove');
  }
};
