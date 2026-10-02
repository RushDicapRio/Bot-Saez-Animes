const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'delay-dm',
  description: 'Configures the DM delay',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'delay-dm',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'delay-dm');
  }
};
