const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'variable-list',
  description: 'Lists the usable variables',
  category: 'Variables',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'variable-list');
  }
};
