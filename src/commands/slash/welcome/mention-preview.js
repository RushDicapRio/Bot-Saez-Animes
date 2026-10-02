const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'mention-preview',
  description: 'Previews the mentions',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'mention-preview',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'mention-preview');
  }
};
