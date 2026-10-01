const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding-test',
  description: 'Test the onboarding process.',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding-test',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding-test');
  }
};
