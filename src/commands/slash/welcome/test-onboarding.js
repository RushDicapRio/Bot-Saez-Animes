const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'test-onboarding',
  description: 'Test the onboarding',
  category: 'Tests',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'test-onboarding');
  }
};
