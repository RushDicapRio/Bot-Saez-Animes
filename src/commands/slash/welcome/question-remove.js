const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'question-remove',
  description: 'Deletes a question',
  category: 'Questions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'question-remove');
  }
};
