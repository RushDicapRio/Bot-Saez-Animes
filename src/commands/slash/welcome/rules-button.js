const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'rules-button',
  description: 'Add an accept button.',
  category: 'Règles & Vérification',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'rules-button');
  }
};
