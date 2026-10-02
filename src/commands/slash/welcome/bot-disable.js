const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'bot-disable',
  description: 'Disables the welcome message for bots',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'bot-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'bot-disable');
  }
};
