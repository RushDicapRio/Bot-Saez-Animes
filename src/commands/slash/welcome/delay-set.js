const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'delay-set',
  description: 'Configures the welcome delay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'delay-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'delay-set');
  }
};
