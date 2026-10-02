const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'logs-clear',
  description: 'Clears the old logs',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'logs-clear',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'logs-clear');
  }
};
