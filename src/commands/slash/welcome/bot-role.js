const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'bot-role',
  description: 'Configures the automatic role for bots',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'bot-role',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'bot-role');
  }
};
