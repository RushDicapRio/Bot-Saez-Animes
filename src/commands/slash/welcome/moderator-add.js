const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'moderator-add',
  description: 'Adds a moderator',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'moderator-add',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'moderator-add');
  }
};
