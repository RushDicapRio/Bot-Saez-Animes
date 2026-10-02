const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'member-role',
  description: 'Configures roles for new members',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'member-role',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'member-role');
  }
};
