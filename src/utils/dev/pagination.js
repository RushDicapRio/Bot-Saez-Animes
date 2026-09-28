const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} = require('discord.js');
/**
 * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} context 
 * @param {import('discord.js').EmbedBuilder[]} pages 
 * @param {number} [timeout=90000] 
 */
async function sendPaginatedEmbed(context, pages, timeout = 90000) {
  if (!pages || !pages.length) return;
  if (pages.length === 1) {
    if (context.isChatInputCommand && context.isChatInputCommand()) {
      return context.reply({ embeds: [pages[0]], flags: MessageFlags.Ephemeral });
    }
    return context.reply({ embeds: [pages[0]] });
  }
  let currentPage = 0;
  const userId = context.user ? context.user.id : context.author.id;
  const customIdPrev = `page_prev_${Date.now()}`;
  const customIdNext = `page_next_${Date.now()}`;
  function getRow(pageIdx) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIdPrev)
        .setLabel('Previous')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIdx === 0),
      new ButtonBuilder()
        .setCustomId(`page_counter`)
        .setLabel(`${pageIdx + 1} / ${pages.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(customIdNext)
        .setLabel('Next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIdx === pages.length - 1)
    );
  }
  const payload = {
    embeds: [pages[currentPage]],
    components: [getRow(currentPage)]
  };
  let response;
  if (context.isChatInputCommand && context.isChatInputCommand()) {
    if (context.deferred || context.replied) {
      response = await context.editReply(payload);
    } else {
      response = await context.reply({ ...payload, flags: MessageFlags.Ephemeral });
    }
    if (!response || !response.createMessageComponentCollector) {
      response = await context.fetchReply();
    }
  } else {
    response = await context.reply(payload);
  }
  const collector = response.createMessageComponentCollector({
    filter: i => i.user.id === userId && (i.customId === customIdPrev || i.customId === customIdNext),
    componentType: ComponentType.Button,
    time: timeout
  });
  collector.on('collect', async i => {
    if (i.customId === customIdPrev && currentPage > 0) {
      currentPage--;
    } else if (i.customId === customIdNext && currentPage < pages.length - 1) {
      currentPage++;
    }
    await i.update({
      embeds: [pages[currentPage]],
      components: [getRow(currentPage)]
    }).catch(() => {});
  });
  collector.on('end', async () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('d_prev').setLabel('Previous').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d_cnt').setLabel(`${currentPage + 1} / ${pages.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d_next').setLabel('Next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );
    if (context.editReply) {
      await context.editReply({ components: [disabledRow] }).catch(() => {});
    } else if (response.edit) {
      await response.edit({ components: [disabledRow] }).catch(() => {});
    }
  });
}
module.exports = { sendPaginatedEmbed };
