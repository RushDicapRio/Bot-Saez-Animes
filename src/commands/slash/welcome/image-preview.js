const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-preview',
  description: 'Previews the welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-preview',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-preview');
  }
};
