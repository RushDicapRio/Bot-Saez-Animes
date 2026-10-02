const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-add',
  description: 'Adds an auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-add',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-add');
  }
};
