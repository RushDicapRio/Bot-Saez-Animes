const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'backup',
  description: 'Backs up the configuration',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'backup',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'backup');
  }
};
