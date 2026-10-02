const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-button',
  description: 'Adds an introduction button',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-button',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-button');
  }
};
