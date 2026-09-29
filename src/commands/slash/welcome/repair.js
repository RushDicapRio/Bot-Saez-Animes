const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'repair',
  description: 'Fixes detected issues',
  category: 'Maintenance',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'repair');
  }
};
