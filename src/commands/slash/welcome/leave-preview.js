const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'leave-preview',
  description: 'Previews the departure message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'leave-preview',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'leave-preview');
  }
};
