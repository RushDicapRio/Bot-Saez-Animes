const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-test',
  description: 'Tests the introduction system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-test');
  }
};
