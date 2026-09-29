const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'test-message',
  description: 'Test the message only.',
  category: 'Tests',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'test-message');
  }
};
