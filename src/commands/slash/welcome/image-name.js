const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'image-name',
  description: 'Configures the name display',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'image-name',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'image-name');
  }
};
