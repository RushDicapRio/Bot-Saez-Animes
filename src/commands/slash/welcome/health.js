const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'health',
  description: 'Checks the status of the system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'health',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'health');
  }
};
