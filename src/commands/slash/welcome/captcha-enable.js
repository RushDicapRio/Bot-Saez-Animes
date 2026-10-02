const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-enable',
  description: 'Enables the CAPTCHA',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-enable',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-enable');
  }
};
