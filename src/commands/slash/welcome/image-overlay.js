const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-overlay',
  description: 'Configures the image overlay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-overlay',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-overlay');
  }
};
