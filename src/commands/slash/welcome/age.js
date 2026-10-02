const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'age',
  description: 'Configures the age requirements',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'age',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'age');
  }
};
