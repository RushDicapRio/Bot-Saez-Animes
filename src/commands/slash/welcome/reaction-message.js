const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reaction-message',
  description: 'Sets the associated message.',
  category: 'Interactivité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reaction-message');
  }
};
