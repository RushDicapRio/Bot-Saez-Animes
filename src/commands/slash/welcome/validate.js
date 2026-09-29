const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'validate',
  description: 'Check the configuration.',
  category: 'Maintenance',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'validate');
  }
};
