const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'nickname-suffix',
  description: 'Defines a suffix',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'nickname-suffix',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'nickname-suffix');
  }
};
