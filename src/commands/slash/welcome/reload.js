const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reload',
  description: 'Recharge the system',
  category: 'Configuration',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reload');
  }
};
