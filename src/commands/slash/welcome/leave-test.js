const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'leave-test',
  description: 'Tests the departure system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'leave-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'leave-test');
  }
};
