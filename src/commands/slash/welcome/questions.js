const WelcomeDispatcher = require('./core/welcomeDispatcher');
const WelcomeContext = require('./core/welcomeContext');
module.exports = {
  name: 'questions',
  description: 'Configure questions for new members.',
  category: 'Questions',
  async execute(ctx, client) {
    return WelcomeDispatcher.dispatch(ctx, 'questions');
  }
};
