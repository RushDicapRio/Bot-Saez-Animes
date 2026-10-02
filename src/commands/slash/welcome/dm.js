const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'dm',
  description: 'Configures the welcome DM message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'dm',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'dm');
  }
};
