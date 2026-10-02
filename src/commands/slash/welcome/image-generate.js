const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-generate',
  description: 'Generates a welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-generate',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-generate');
  }
};
