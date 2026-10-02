const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'embed-disable',
  description: 'Disables the welcome embed',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'embed-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'embed-disable');
  }
};
