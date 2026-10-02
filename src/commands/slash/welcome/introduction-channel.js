const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-channel',
  description: 'Sets the introduction channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-channel');
  }
};
