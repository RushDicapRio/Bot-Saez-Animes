const StarboardService = require('../../services/starboard/StarboardService');
module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
      const guild = reaction.message.guild;
      if (!guild) return;
      const settings = StarboardService.getSettings(guild.id);
      if (!settings.enabled || !settings.channel_id) return;
      const emojiName = reaction.emoji.name;
      if (emojiName !== settings.emoji && reaction.emoji.toString() !== settings.emoji) {
        return;
      }
      StarboardService.removeReaction(guild.id, reaction.message.id, user.id, settings.emoji);
      const post = StarboardService.getPostByOriginalId(guild.id, reaction.message.id);
      if (!post || !post.starboard_message_id) return;
      const totalStars = reaction.count || StarboardService.getReactionsCount(reaction.message.id, settings.emoji);
      const starboardChannel = guild.channels.cache.get(settings.channel_id);
      if (!starboardChannel) return;
      if (totalStars <= 0) {
        try {
          const sbMsg = await starboardChannel.messages.fetch(post.starboard_message_id);
          if (sbMsg) await sbMsg.delete();
        } catch (_) {}
        StarboardService.deletePost(guild.id, post.id);
      } else {
        try {
          const sbMsg = await starboardChannel.messages.fetch(post.starboard_message_id);
          if (sbMsg) {
            const content = `${settings.emoji} **${totalStars}** | <#${reaction.message.channel.id}>`;
            await sbMsg.edit({ content });
            StarboardService.updatePostStars(post.id, totalStars);
          }
        } catch (_) {}
      }
    } catch (error) {
      console.error('[Starboard ReactionRemove Error]:', error);
    }
  }
};
