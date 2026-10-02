const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'nickname',
  description: 'Configure the automatic nickname',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'nickname',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'nickname');
  }
};
