const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha',
  description: 'Configures the CAPTCHA',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha');
  }
};
