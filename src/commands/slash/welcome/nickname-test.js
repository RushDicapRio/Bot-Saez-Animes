const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'nickname-test',
  description: 'Test the nickname',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'nickname-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'nickname-test');
  }
};
