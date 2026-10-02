const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'captcha-role',
  description: 'Sets the role after validation',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'captcha-role',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'captcha-role');
  }
};
