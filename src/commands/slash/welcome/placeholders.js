const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'placeholders',
  description: 'Displays available placeholders',
  category: 'Variables',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'placeholders');
  }
};
