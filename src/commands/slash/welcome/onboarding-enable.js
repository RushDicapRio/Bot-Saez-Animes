const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding-enable',
  description: 'Activates onboarding',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding-enable');
  }
};
