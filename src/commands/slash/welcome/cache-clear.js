const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'cache-clear',
  description: 'Clears the cache',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'cache-clear',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'cache-clear');
  }
};
