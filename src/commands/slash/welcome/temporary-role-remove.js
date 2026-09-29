const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'temporary-role-remove',
  description: 'Remove the temporary role',
  category: 'Sécurité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'temporary-role-remove');
  }
};
