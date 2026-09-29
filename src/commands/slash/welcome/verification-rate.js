const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verification-rate',
  description: 'Displays the verification rate',
  category: 'Statistiques',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verification-rate');
  }
};
