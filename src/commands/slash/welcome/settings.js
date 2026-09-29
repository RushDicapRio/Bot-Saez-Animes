const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'settings',
  description: 'Displays the welcome settings',
  category: 'Configuration',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'settings');
  }
};
