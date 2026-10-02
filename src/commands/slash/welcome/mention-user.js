const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'mention-user',
  description: 'Enables user mentions in the welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'mention-user',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'mention-user');
  }
};
