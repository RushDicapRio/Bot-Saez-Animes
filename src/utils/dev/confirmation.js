const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} = require('discord.js');
/**
 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context 
 * @param {object} options
 * @param {string} options.title 
 * @param {string} options.description 
 * @param {number} [options.timeout=45000] 
 * @param {boolean} [options.danger=true]
 * @returns {Promise<boolean>} 
 */
async function askConfirmation(context, { title, description, timeout = 45000, danger = true }) {
  const userId = context.user ? context.user.id : context.author.id;
  const customIdConfirm = `dev_confirm_${Date.now()}`;
  const customIdCancel = `dev_cancel_${Date.now()}`;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customIdConfirm)
      .setLabel('CONFIRM')
      .setEmoji('⚠️')
      .setStyle(danger ? ButtonStyle.Danger : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(customIdCancel)
      .setLabel('CANCEL')
      .setEmoji('✖️')
      .setStyle(ButtonStyle.Secondary)
  );
  const payload = {
    content: `⚠️ **${title}**\n${description}\n\n*Click a button below to confirm or cancel (Expires in ${Math.floor(timeout / 1000)}s).*`,
    components: [row]
  };
  let message;
  if (context.isChatInputCommand && context.isChatInputCommand()) {
    if (context.deferred || context.replied) {
      message = await context.editReply(payload);
    } else {
      message = await context.reply({ ...payload, flags: MessageFlags.Ephemeral });
    }
  } else {
    message = await context.reply(payload);
  }
  if (!message || !message.createMessageComponentCollector) {
    message = await context.fetchReply();
  }
  try {
    const confirmation = await message.awaitMessageComponent({
      filter: i => {
        if (i.user.id !== userId) {
          i.reply({ content: '⛔ Only the person who placed this order can confirm.', flags: MessageFlags.Ephemeral });
          return false;
        }
        return i.customId === customIdConfirm || i.customId === customIdCancel;
      },
      componentType: ComponentType.Button,
      time: timeout
    });
    if (confirmation.customId === customIdConfirm) {
      await confirmation.update({
        content: `⏳ **Action confirmed by the administrator.** Execution in progress...`,
        components: []
      }).catch(() => {});
      return true;
    } else {
      await confirmation.update({
        content: `❌ **Action cancelled.**`,
        components: []
      }).catch(() => {});
      return false;
    }
  } catch {
    if (context.editReply) {
      await context.editReply({
        content: `⏱️ **Time expired.** The operation was automatically cancelled for security reasons.`,
        components: []
      }).catch(() => {});
    } else if (message.edit) {
      await message.edit({
        content: `⏱️ **Time expired.** The operation was automatically cancelled for security reasons.`,
        components: []
      }).catch(() => {});
    }
    return false;
  }
}
module.exports = { askConfirmation };
