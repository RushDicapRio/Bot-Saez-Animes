const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'anti-raid-action',
  description: 'Sets the action',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'anti-raid-action',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'anti-raid-action');
  }
};
