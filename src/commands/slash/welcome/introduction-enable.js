const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-enable',
  description: 'Enables the introduction system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-enable');
  }
};
