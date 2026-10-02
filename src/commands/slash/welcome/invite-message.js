const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite-message',
  description: 'Displays the inviter in the message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite-message');
  }
};
