const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'anti-raid-disable',
  description: 'Disables the raid protection',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'anti-raid-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'anti-raid-disable');
  }
};
