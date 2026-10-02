const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-enable',
  description: 'Enables the auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-enable');
  }
};
