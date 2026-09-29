const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reaction-role',
  description: 'Associate a reaction with a role',
  category: 'Interactivité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reaction-role');
  }
};
