const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar-hide',
  description: 'Hides the avatar',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar-hide',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar-hide');
  }
};
