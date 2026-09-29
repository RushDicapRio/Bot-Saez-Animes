const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'return-enable',
  description: 'Enables feedback messages',
  category: 'Retours',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'return-enable');
  }
};
