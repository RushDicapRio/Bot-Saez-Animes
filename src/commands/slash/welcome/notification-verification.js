const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'notification-verification',
  description: 'Verification notification',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'notification-verification',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'notification-verification');
  }
};
