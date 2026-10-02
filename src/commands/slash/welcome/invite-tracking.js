const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite-tracking',
  description: 'Enables invitation tracking',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite-tracking',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite-tracking');
  }
};
