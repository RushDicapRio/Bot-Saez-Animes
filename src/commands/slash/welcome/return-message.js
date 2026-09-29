const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'return-message',
  description: 'Sets the return message',
  category: 'Retours',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'return-message');
  }
};
