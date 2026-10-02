const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'nickname-set',
  description: 'Sets the nickname format',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'nickname-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'nickname-set');
  }
};
