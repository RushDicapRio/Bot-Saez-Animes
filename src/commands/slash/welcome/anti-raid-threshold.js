const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'anti-raid-threshold',
  description: 'Sets the threshold',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'anti-raid-threshold',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'anti-raid-threshold');
  }
};
