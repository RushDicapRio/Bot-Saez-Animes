const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'moderator-remove',
  description: 'Removes a moderator',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'moderator-remove',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'moderator-remove');
  }
};
