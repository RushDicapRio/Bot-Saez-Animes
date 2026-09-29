const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'placeholder-test',
  description: 'Testing a placeholder',
  category: 'Variables',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'placeholder-test');
  }
};
