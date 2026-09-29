const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verification-enable',
  description: 'Enable verification',
  category: 'Règles & Vérification',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verification-enable');
  }
};
