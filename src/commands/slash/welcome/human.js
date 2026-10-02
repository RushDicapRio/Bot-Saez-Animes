const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'human',
  description: 'Configures the welcome for human users',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'human',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'human');
  }
};
