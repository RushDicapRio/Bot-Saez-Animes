const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reaction',
  description: 'Configure welcome reactions',
  category: 'Interactivité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reaction');
  }
};
