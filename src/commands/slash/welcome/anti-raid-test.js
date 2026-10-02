const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'anti-raid-test',
  description: 'Tests the raid protection',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'anti-raid-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'anti-raid-test');
  }
};
