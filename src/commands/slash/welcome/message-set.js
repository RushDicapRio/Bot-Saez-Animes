const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-set',
  description: 'Sets the welcome ',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-set');
  }
};
