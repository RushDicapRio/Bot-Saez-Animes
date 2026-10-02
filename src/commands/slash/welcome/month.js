const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'month',
  description: 'Displays arrivals for the month',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'month',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'month');
  }
};
