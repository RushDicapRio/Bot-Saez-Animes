const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');

module.exports = {
  name: 'cache-refresh',
  description: 'Actualise le cache',
  category: 'Maintenance',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'cache-refresh');
  }
};
