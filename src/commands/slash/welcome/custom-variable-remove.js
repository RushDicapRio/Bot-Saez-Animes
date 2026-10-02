const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'custom-variable-remove',
  description: 'Removes a custom variable',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'custom-variable-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'custom-variable-remove');
  }
};
