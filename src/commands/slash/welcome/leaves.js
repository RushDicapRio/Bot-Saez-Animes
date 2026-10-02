const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'leaves',
  description: 'Displays the departure statistics',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'leaves',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'leaves');
  }
};
