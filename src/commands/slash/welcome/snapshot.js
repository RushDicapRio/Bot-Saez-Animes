const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'snapshot',
  description: 'Create a snapshot',
  category: 'Sauvegardes',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'snapshot');
  }
};
