const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'snapshot-list',
  description: 'Displays snapshots',
  category: 'Sauvegardes',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'snapshot-list');
  }
};
