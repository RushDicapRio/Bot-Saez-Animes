const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'invite-show',
  description: 'Displays the used invitation',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'invite-show',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'invite-show');
  }
};
