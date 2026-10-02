const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image',
  description: 'Configures the welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image');
  }
};
