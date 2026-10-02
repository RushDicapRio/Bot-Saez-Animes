const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-background',
  description: 'Configures the background image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-background',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-background');
  }
};
