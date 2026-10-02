const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-remove',
  description: 'Removes an auto role',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-remove');
  }
};
