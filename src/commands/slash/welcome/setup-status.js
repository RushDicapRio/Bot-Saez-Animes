const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'setup-status',
  description: 'Displays the configuration status',
  category: 'Configuration',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'setup-status');
  }
};
