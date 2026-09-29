const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'rollback',
  description: 'Restores a previous configuration',
  category: 'Sauvegardes',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'rollback');
  }
};
