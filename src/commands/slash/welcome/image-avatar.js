const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-avatar',
  description: 'Configures the member avatar',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-avatar',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-avatar');
  }
};
