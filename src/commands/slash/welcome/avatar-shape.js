const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar-shape',
  description: 'Sets the avatar shape',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar-shape',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar-shape');
  }
};
