const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'restore',
  description: 'Restores a backup',
  category: 'Sauvegardes',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'restore');
  }
};
