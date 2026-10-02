const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'banner-reset',
  description: 'Resets the welcome banner',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'banner-reset',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'banner-reset');
  }
};
