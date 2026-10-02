const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'message-edit',
  description: 'Edits the welcome message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'message-edit',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'message-edit');
  }
};
