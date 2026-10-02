const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'average',
  description: 'Displays the average join time',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'average',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'average');
  }
};
