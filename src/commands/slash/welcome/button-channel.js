const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'button-channel',
  description: 'Associates a channel with a button',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'button-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'button-channel');
  }
};
