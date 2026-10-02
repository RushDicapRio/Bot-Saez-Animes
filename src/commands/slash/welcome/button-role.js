const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'button-role',
  description: 'Associates a role with a button',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'button-role',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'button-role');
  }
};
