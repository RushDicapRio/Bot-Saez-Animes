const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'banner',
  description: 'Configures the welcome banner',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'banner',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'banner');
  }
};
