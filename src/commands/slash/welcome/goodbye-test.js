const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'goodbye-test',
  description: 'Tests the goodbye message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'goodbye-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'goodbye-test');
  }
};
