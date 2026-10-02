const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'daily',
  description: 'Displays daily statistics',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'daily',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'daily');
  }
};
