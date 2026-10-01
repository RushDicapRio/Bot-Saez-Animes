const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-leave',
  description: 'Notice of departure',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-leave',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-leave');
  }
};
