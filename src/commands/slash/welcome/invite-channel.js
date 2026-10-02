const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite-channel',
  description: 'Sets the tracking channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite-channel');
  }
};
