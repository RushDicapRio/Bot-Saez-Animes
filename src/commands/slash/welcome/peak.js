const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'peak',
  description: 'Displays arrival peaks',
  category: 'Statistiques',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'peak');
  }
};
