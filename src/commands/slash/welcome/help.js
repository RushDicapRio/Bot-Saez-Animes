const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'help',
  description: 'Displays the complete help for the welcome system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'help',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'help');
  }
};
