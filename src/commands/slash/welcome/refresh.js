const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'refresh',
  description: 'Updates the configuration',
  category: 'Configuration',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'refresh');
  }
};
