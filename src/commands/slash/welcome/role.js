const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'role',
  description: 'Configure automatic roles',
  category: 'Autoroles',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'role');
  }
};
