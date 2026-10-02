const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'leave',
  description: 'Configures the departure system',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'leave',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'leave');
  }
};
