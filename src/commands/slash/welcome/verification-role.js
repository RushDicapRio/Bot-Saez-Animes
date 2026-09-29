const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verification-role',
  description: 'Defines the verification role',
  category: 'Règles & Vérification',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verification-role');
  }
};
