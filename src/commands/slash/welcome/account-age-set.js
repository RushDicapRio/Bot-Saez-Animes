const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'account-age-set',
  description: 'Sets the minimum account age',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'account-age-set',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'account-age-set');
  }
};
