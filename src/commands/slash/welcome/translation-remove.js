const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'translation-remove',
  description: 'Remove a translation',
  category: 'Localisation',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'translation-remove');
  }
};
