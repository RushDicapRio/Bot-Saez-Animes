const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'permissions',
  description: 'Displays permissions',
  category: 'Permissions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'permissions');
  }
};
