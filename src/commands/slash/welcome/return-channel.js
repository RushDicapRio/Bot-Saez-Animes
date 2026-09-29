const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'return-channel',
  description: 'Defines the living room',
  category: 'Retours',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'return-channel');
  }
};
