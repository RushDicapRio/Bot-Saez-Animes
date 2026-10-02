const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'logs-disable',
  description: 'Disables logging',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'logs-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'logs-disable');
  }
};
