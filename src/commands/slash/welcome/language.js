const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'language',
  description: 'Sets the language',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'language',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'language');
  }
};
