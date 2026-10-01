const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding-message',
  description: 'Sets the message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding-message');
  }
};
