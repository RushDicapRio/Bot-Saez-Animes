const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding',
  description: 'Configurer l’intégration des nouveaux membres',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding');
  }
};
