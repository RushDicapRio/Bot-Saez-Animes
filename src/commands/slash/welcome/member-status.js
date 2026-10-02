const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member-status',
  description: 'Displays the integration status of a member',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member-status',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member-status');
  }
};
