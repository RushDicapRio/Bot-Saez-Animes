const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-position',
  description: 'Sets the image positions',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-position',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-position');
  }
};
