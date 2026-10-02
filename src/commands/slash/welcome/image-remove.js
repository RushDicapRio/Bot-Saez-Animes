const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-remove',
  description: 'Removes the welcome image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-remove');
  }
};
