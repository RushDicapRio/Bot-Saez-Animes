const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'translation',
  description: 'Configure translations',
  category: 'Localisation',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'translation');
  }
};
