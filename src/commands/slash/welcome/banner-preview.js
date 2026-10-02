const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'banner-preview',
  description: 'Previews the welcome banner',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'banner-preview',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'banner-preview');
  }
};
