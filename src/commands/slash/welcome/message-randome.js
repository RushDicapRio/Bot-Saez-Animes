const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-random',
  description: 'Uses a random welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-random',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-random');
  }
};
