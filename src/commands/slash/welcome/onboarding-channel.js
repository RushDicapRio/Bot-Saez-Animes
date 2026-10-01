const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding-channel',
  description: 'Defines the living channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding-channel');
  }
};
