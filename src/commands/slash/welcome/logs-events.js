const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'logs-events',
  description: 'Configures the logged events',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'logs-events',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'logs-events');
  }
};
