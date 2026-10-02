const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'mention-server',
  description: 'Enables server mentions in the welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'mention-server',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'mention-server');
  }
};
