import { SlashCommandBuilder } from "discord.js";
import { getRank } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Mostra seu nível e XP")
    .addUserOption((opt) =>
      opt.setName("usuario").setDescription("Ver o rank de outra pessoa").setRequired(false)
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario") || interaction.user;
    const dados = getRank(interaction.guild.id, usuario.id);
    await interaction.reply(`📊 **${usuario.tag}** está no nível **${dados.level}** com **${dados.xp}** XP.`);
  },
};
