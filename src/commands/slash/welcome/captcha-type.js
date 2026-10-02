const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-type',
  description: 'Sets the CAPTCHA type',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-type',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-type');
  }
};
