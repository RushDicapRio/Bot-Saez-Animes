const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'introduction-template',
  description: 'Sets the introduction template',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'introduction-template',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'introduction-template');
  }
};
