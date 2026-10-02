const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'button',
  description: 'Configures the buttons',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'button',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'button');
  }
};
