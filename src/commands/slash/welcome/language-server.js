const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'language-server',
  description: 'Sets the language of the server',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'language-server',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'language-server');
  }
};
