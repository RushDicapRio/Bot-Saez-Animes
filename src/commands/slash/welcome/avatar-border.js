const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'avatar-border',
  description: 'Configures the avatar border',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'avatar-border',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'avatar-border');
  }
};
