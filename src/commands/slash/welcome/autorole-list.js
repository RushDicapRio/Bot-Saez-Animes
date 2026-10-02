const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'autorole-list',
  description: 'Displays the auto roles',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'autorole-list',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'autorole-list');
  }
};
