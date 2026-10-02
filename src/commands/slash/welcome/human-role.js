const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'human-role',
  description: 'Configures the automatic role for humans',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'human-role',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'human-role');
  }
};
