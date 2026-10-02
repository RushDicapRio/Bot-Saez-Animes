const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'growth',
  description: 'Displays the growth of the server',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'growth',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'growth');
  }
};
