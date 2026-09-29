const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'setup-wizard',
  description: 'Launches the setup wizard',
  category: 'Configuration',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'setup-wizard');
  }
};
