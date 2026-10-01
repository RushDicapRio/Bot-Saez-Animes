const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'onboarding-roles',
  description: 'Configurer les rôles proposés',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'onboarding-roles',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'onboarding-roles');
  }
};
