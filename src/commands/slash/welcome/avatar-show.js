const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar-show',
  description: 'Displays the avatar',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar-show',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar-show');
  }
};
