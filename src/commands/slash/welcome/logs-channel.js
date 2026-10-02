const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'logs-channel',
  description: 'Sets the logs channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'logs-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'logs-channel');
  }
};
