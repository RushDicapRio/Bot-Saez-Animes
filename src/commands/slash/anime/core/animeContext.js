const { EmbedBuilder } = require('discord.js');
const config = require('../../../../config');
class AnimeContext {
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
    if (name === 'parametre' || name === 'titre' || name === 'recherche' || name === 'anime' || name === 'option') {
      return this.param || '';
    }
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
  async defer() {
    if (this.isSlash && !this._deferred && !this.raw.replied && !this.raw.deferred) {
      await this.raw.deferReply();
      this._deferred = true;
    }
  }
  async reply(content) {
    const payload = typeof content === 'string' ? { content } : content;
    if (this.isSlash) {
      if (this.raw.deferred || this._deferred) {
        return this.raw.editReply(payload);
      }
      if (this.raw.replied) {
        return this.raw.followUp(payload);
      }
      return this.raw.reply(payload);
    } else {
      return this.raw.reply(payload);
    }
  }
  createEmbed(color = config.colors?.primary || '#E91E63') {
    return new EmbedBuilder()
      .setColor(color)
      .setTimestamp()
      .setFooter({
        text: `Developed with ❤️ by Saez | Système d\'Administration • ${this.guild ? this.guild.name : 'Discord'}`,
        iconURL: this.client.user?.displayAvatarURL()
      });
  }
}

module.exports = AnimeContext;
