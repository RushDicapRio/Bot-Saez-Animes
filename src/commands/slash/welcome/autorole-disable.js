const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-disable',
  description: 'Disables the auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-disable');
  }
};
