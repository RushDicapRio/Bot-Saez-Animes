const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-set',
  description: 'Sets the auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-set');
  }
};
