const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'human-enable',
  description: 'Enables the human welcome',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'human-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'human-enable');
  }
};
