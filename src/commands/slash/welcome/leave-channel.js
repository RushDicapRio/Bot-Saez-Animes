const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'leave-channel',
  description: 'Sets the departure channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'leave-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'leave-channel');
  }
};
