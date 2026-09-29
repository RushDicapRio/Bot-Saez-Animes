const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'today',
  description: 'Displays members who joined today',
  category: 'Statistiques',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'today');
  }
};
