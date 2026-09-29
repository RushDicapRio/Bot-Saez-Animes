const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'statistics',
  description: 'Displays detailed statistics',
  category: 'Statistiques',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'statistics');
  }
};
