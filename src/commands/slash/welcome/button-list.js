const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'button-list',
  description: 'Displays the buttons',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'button-list',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'button-list');
  }
};
