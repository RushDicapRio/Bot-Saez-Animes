const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'variables',
  description: 'Displays available variables',
  category: 'Variables',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'variables');
  }
};
