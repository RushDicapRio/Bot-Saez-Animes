const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'debug',
  description: 'Displays diagnostic information',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'debug',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'debug');
  }
};
