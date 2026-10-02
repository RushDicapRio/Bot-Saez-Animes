const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'dm-enable',
  description: 'Enables the welcome DM',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'dm-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'dm-enable');
  }
};
