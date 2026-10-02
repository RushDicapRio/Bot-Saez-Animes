const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar-size',
  description: 'Sets the avatar size',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar-size',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar-size');
  }
};
