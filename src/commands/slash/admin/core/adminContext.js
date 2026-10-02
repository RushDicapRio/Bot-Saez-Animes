const { EmbedBuilder } = require('discord.js');
const config = require('../../../../config');
class AdminContext {
  constructor(rawContext, client, args = {}) {
    this.raw = rawContext;
    this.client = client || rawContext.client;
    this.isSlash = !!rawContext.isChatInputCommand || !!rawContext.isCommand;
    this.user = this.isSlash ? rawContext.user : rawContext.author;
    this.member = rawContext.member;
    this.guild = rawContext.guild;
    this.channel = rawContext.channel;
    this.commandName = args.commandName || '';
    this.param = args.param || '';
    this.targetUser = args.targetUser || null;
    this._deferred = false;
  }
  getString(name) {
    if (this.isSlash && this.raw.options) {
      return this.raw.options.getString(name);
    }
    if (name === 'commande') return this.commandName || '';
    if (name === 'parametre' || name === 'valeur') return this.param || '';
    return this.param || '';
  }
  getInteger(name) {
    if (this.isSlash && this.raw.options) {
      return this.raw.options.getInteger(name);
    }
    const val = parseInt(this.param, 10);
    return isNaN(val) ? null : val;
  }
  getUser(name) {
    return this.getTargetUser();
  }
  getTargetUser() {
    if (this.isSlash && this.raw.options) {
      return this.raw.options.getUser('cible') || null;
    }
    if (this.targetUser) return this.targetUser;
    if (this.raw.mentions?.users?.size > 0) {
      return this.raw.mentions.users.first();
    }
    if (this.param && this.client) {
      const cleanId = this.param.replace(/[<@!>]/g, '').trim();
      if (/^\d{17,20}$/.test(cleanId)) {
        return this.client.users.cache.get(cleanId) || null;
      }
    }
    return null;
  }
  getRole(name) {
    if (this.isSlash && this.raw.options) {
      return this.raw.options.getRole(name) || null;
    }
    if (this.raw.mentions?.roles?.size > 0) {
      return this.raw.mentions.roles.first();
    }
    if (this.param && this.guild) {
      const cleanId = this.param.replace(/[<@&>]/g, '').trim();
      if (/^\d{17,20}$/.test(cleanId)) {
        return this.guild.roles.cache.get(cleanId) || null;
      }
    }
    return null;
  }
  getChannel(name) {
    if (this.isSlash && this.raw.options) {
      return this.raw.options.getChannel(name) || this.channel;
    }
    if (this.raw.mentions?.channels?.size > 0) {
      return this.raw.mentions.channels.first();
    }
    return this.channel;
  }
  buildEmbed(options = {}) {
    const embed = new EmbedBuilder();
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.fields && Array.isArray(options.fields)) embed.addFields(options.fields);
    embed.setColor(options.color !== undefined ? options.color : (config.colors?.primary || 0x2b2d31));
    if (options.footer) {
      if (typeof options.footer === 'string') embed.setFooter({ text: options.footer });
      else embed.setFooter(options.footer);
    }
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    embed.setTimestamp();
    return embed;
  }
  async defer(ephemeral = false) {
    if (this.isSlash && !this._deferred) {
      await this.raw.deferReply({ ephemeral });
      this._deferred = true;
    }
  }
  async reply(response) {
    let payload = {};
    if (typeof response === 'string') {
      payload = { content: response };
    } else if (response && response.embeds) {
      payload = response;
    } else {
      payload = { content: String(response) };
    }
    if (this.isSlash) {
      if (this.raw.deferred || this._deferred) {
        return this.raw.editReply(payload);
      }
      return this.raw.reply(payload);
    } else {
      return this.raw.reply(payload);
    }
  }
}
module.exports = AdminContext;
