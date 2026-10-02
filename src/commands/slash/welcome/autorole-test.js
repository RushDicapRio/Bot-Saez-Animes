const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-test',
  description: 'Tests the auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-test');
  }
};
