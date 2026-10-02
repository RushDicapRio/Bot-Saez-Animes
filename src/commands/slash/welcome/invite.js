const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite',
  description: 'Configures the invitation information',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite');
  }
};
