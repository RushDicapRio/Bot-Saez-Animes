const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'enable',
  description: 'Enables the welcome system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'enable');
  }
};
