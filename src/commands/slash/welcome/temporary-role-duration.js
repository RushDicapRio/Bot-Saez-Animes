const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'temporary-role-duration',
  description: 'Sets its duration',
  category: 'Sécurité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'temporary-role-duration');
  }
};
