const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'permission-remove',
  description: 'Revoke a permission',
  category: 'Permissions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'permission-remove');
  }
};
