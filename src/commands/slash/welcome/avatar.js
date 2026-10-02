const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar',
  description: 'Configures the avatar display',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar');
  }
};
