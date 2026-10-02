const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-reset',
  description: 'Resets the welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-reset',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-reset');
  }
};
