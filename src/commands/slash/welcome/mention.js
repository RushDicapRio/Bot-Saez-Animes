const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'mention',
  description: 'Configure the mentions',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'mention',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'mention');
  }
};
