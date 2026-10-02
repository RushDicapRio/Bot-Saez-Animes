const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'dm-image',
  description: 'Configures the welcome DM image',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'dm-image',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'dm-image');
  }
};
