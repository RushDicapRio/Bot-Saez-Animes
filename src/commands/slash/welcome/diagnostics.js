const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'diagnostics',
  description: 'Perform a diagnosis',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'diagnostics',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'diagnostics');
  }
};
