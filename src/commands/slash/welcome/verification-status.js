const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verification-status',
  description: 'Displays the verification status',
  category: 'Règles & Vérification',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verification-status');
  }
};
