const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'welcome-role',
  description: 'Sets the temporary welcome role.',
  category: 'Sécurité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'welcome-role');
  }
};
