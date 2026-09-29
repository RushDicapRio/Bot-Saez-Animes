const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'weekly',
  description: 'Displays weekly statistics',
  category: 'Statistiques',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'weekly');
  }
};
