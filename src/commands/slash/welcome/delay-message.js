const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'delay-message',
  description: 'Configures the message delay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'delay-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'delay-message');
  }
};
