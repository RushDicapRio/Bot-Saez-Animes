const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member-verify',
  description: 'Manually verifies a member',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member-verify',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member-verify');
  }
};
