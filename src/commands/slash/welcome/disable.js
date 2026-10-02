const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'disable',
  description: 'Désactiver le système de bienvenue',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'disable');
  }
};
