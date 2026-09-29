const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reaction-remove',
  description: 'Remove a reaction',
  category: 'Interactivité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reaction-remove');
  }
};
