const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext')
module.exports = {
  name: 'delay',
  description: 'Configures the delays',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'delay',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'delay');
  }
};
