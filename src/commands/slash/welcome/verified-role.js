const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'verified-role',
  description: 'Configure the role for verified members',
  category: 'Autoroles',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'verified-role');
  }
};
