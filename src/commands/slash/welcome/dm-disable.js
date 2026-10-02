const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'dm-disable',
  description: 'Désactive les messages privés',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'dm-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'dm-disable');
  }
};
