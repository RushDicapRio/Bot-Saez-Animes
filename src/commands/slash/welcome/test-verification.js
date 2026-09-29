const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'test-verification',
  description: 'Test the verification',
  category: 'Tests',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'test-verification');
  }
};
