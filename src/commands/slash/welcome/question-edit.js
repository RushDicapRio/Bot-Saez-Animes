const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'question-edit',
  description: 'Edit a question',
  category: 'Questions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'question-edit');
  }
};
