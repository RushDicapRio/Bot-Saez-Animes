const { EmbedBuilder } = require('discord.js');
const StarboardService = require('../../services/starboard/StarboardService');
module.exports = {
  name: 'messageReactionAdd',
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
      if (!settings.self_star && reaction.message.author?.id === user.id) {
        return;
      }
      if (StarboardService.isExcluded(guild.id, 'channel', reaction.message.channel.id)) return;
      if (StarboardService.isExcluded(guild.id, 'user', reaction.message.author?.id)) return;
      if (reaction.message.author?.bot && StarboardService.isExcluded(guild.id, 'bot', 'all')) return;
      StarboardService.addReaction(guild.id, reaction.message.id, user.id, settings.emoji);
      const totalStars = reaction.count || StarboardService.getReactionsCount(reaction.message.id, settings.emoji);
      if (totalStars >= settings.threshold) {
        const starboardChannel = guild.channels.cache.get(settings.channel_id);
        if (!starboardChannel) return;
        let existingPost = StarboardService.getPostByOriginalId(guild.id, reaction.message.id);
        const embed = new EmbedBuilder()
          .setColor(settings.color || '#FFAC33')
          .setAuthor({
            name: reaction.message.author?.tag || 'User',
            iconURL: reaction.message.author?.displayAvatarURL()
          })
          .setDescription(reaction.message.content || '*Attachment / media*')
          .addFields({
            name: 'Source',
            value: `[Access the original message](${reaction.message.url}) In <#${reaction.message.channel.id}>`
          })
          .setTimestamp(reaction.message.createdAt)
          .setFooter({ text: `developed with ❤️ by Saez | ID : ${reaction.message.id}` });

        const firstAttachment = reaction.message.attachments.first();
        if (firstAttachment && firstAttachment.contentType?.startsWith('image/')) {
          embed.setImage(firstAttachment.url);
        }
        const content = `${settings.emoji} **${totalStars}** | <#${reaction.message.channel.id}>`;
        if (existingPost && existingPost.starboard_message_id) {
          try {
            const sbMsg = await starboardChannel.messages.fetch(existingPost.starboard_message_id);
            if (sbMsg) {
              await sbMsg.edit({ content, embeds: [embed] });
              StarboardService.updatePostStars(existingPost.id, totalStars);
            }
          } catch (err) {
            const sent = await starboardChannel.send({ content, embeds: [embed] });
            StarboardService.updatePostStars(existingPost.id, totalStars, sent.id);
          }
        } else {
          const sent = await starboardChannel.send({ content, embeds: [embed] });
          StarboardService.createPost(guild.id, {
            original_message_id: reaction.message.id,
            original_channel_id: reaction.message.channel.id,
            starboard_message_id: sent.id,
            author_id: reaction.message.author?.id || 'unknown',
            stars_count: totalStars,
            content: reaction.message.content || '',
            attachments: reaction.message.attachments.map(a => a.url)
          });
        }
      }
    } catch (error) {
      console.error('[Starboard ReactionAdd Error] :', error);
    }
  }
};
