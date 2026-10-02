const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-delay',
  description: 'Configures the delay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-delay',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-delay');
  }
};
