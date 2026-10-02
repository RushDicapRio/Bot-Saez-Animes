const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-message',
  description: 'Sets the introduction message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-message');
  }
};
