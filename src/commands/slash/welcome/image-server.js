const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-server',
  description: 'Configures the server name display',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-server',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-server');
  }
};
