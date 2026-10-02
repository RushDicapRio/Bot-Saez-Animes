const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'human-message',
  description: 'Configures the welcome message for humans',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'human-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'human-message');
  }
};
