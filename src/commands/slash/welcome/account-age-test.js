const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'account-age-test',
  description: 'Tests the age verification',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'account-age-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'account-age-test');
  }
};
