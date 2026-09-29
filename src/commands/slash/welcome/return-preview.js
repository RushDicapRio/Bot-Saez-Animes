const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'return-preview',
  description: 'Preview the message',
  category: 'Retours',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'return-preview');
  }
};
