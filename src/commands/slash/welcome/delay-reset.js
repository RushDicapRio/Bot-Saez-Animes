const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'delay-reset',
  description: 'Resets the delays',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'delay-reset',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'delay-reset');
  }
};
