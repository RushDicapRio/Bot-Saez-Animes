const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'test',
  description: 'Test the complete system.',
  category: 'Tests',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'test');
  }
};
