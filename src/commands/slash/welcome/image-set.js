const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-set',
  description: 'Sets a welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-set');
  }
};
