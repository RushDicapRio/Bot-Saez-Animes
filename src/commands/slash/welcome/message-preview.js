const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-preview',
  description: 'Previews the welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-preview',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-preview');
  }
};
