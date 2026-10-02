const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'banner-remove',
  description: 'Removes the welcome banner',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'banner-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'banner-remove');
  }
};
