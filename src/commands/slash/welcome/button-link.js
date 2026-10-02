const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'button-link',
  description: 'Associates a link with a button',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'button-link',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'button-link');
  }
};
