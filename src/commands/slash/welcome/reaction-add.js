const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'reaction-add',
  description: 'Add a reaction',
  category: 'Interactivité',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'reaction-add');
  }
};
