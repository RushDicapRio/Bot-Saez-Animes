const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'bot-message',
  description: 'Sets the welcome message for bots',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'bot-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'bot-message');
  }
};
