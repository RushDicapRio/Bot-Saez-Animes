const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member-history',
  description: 'Displays the welcome history for a member',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member-history',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member-history');
  }
};
