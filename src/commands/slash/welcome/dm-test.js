const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'dm-test',
  description: 'Tests the welcome DM',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'dm-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'dm-test');
  }
};
