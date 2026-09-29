const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'question-required',
  description: 'Makes a question mandatory',
  category: 'Questions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'question-required');
  }
};
