const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-font',
  description: 'Configures the font',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-font',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-font');
  }
};
