const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'account-age-action',
  description: 'Sets the action for recently created accounts',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'account-age-action',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'account-age-action');
  }
};
