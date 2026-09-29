const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'test-image',
  description: 'Test the image',
  category: 'Tests',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'test-image');
  }
};
