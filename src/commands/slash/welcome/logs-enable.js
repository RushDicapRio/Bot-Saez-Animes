const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'logs-enable',
  description: 'Enables logging',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'logs-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'logs-enable');
  }
};
