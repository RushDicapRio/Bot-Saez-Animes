const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-message',
  description: 'Sets the CAPTCHA message',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-message',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-message');
  }
};
