const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member',
  description: 'Displays the welcome information for a member',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member');
  }
};
