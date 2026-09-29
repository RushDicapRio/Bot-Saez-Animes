const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'personalization',
  description: 'Configure personalization',
  category: 'Personnalisation',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'personalization');
  }
};
