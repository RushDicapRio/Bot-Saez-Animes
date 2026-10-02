const WelcomeDispatcher = require('../../slash/welcome/core/welcomeDispatcher');
const WelcomeContext = require('../../slash/welcome/core/welcomeContext');
module.exports = {
  name: 'channel-unlock',
  description: 'Unlocks the channels after verification',
  category: 'welcome',
  aliases: [],
  async execute(client, message, args) {
    const ctx = new WelcomeContext(message, client, {
      commandName: 'channel-unlock',
      param: args.join(' ')
    });
    return WelcomeDispatcher.dispatch(ctx, 'channel-unlock');
  }
};
