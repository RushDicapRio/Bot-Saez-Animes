const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'bot-ignore',
  description: 'Ignore the bots',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'bot-ignore',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'bot-ignore');
  }
};
