const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'language-user',
  description: 'Sets the language according to the user',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'language-user',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'language-user');
  }
};
