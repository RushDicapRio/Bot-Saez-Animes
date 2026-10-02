const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'database-status',
  description: 'Checks the database status',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'database-status',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'database-status');
  }
};
