const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-timeout',
  description: 'Sets the CAPTCHA timeout',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-timeout',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-timeout');
  }
};
