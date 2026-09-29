const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'role-remove',
  description: 'Remove an automatic role',
  category: 'Autoroles',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'role-remove');
  }
};
