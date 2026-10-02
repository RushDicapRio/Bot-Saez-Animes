const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'database-clean',
  description: 'Cleans the database',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'database-clean',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'database-clean');
  }
};
