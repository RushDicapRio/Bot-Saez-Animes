const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'joins',
  description: 'Displays join statistics',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'joins',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'joins');
  }
};
