const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'human-disable',
  description: 'Disables the human welcome',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'human-disable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'human-disable');
  }
};
