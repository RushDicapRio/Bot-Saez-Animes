const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'account-age',
  description: 'Checks the age of the Discord account',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'account-age',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'account-age');
  }
};
