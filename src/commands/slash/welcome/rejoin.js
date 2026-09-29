const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'rejoin',
  description: 'Configure members who rejoin',
  category: 'Retours',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'rejoin');
  }
};
