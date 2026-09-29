const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'temporary-role',
  description: 'Configure the temporary role',
  category: 'Sécurité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'temporary-role');
  }
};
