const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verification-disable',
  description: 'Disables verification',
  category: 'Règles & Vérification',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verification-disable');
  }
};
