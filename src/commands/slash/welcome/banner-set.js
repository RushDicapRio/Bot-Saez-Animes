const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'banner-set',
  description: 'Sets a welcome banner',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'banner-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'banner-set');
  }
};
