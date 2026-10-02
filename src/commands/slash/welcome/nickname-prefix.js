const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'nickname-prefix',
  description: 'Defines a prefix',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'nickname-prefix',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'nickname-prefix');
  }
};
