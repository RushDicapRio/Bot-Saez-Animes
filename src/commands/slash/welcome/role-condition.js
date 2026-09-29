const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'role-condition',
  description: 'Configure an allocation condition',
  category: 'Autoroles',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'role-condition');
  }
};
