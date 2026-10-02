const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-channel',
  description: 'Sets the CAPTCHA channel',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-channel',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-channel');
  }
};
