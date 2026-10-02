const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member-reset',
  description: 'Resets a member\'s welcome status',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member-reset',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member-reset');
  }
};
