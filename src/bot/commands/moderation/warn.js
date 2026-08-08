import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addWarning, logActivity } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Dá um aviso a um membro")
    .addUserOption((opt) => opt.setName("usuario").setDescription("Quem avisar").setRequired(true))
    .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo do aviso").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo");

    addWarning(interaction.guild.id, usuario.id, interaction.user.id, motivo);
    logActivity(interaction.guild.id, "warn", {
      actorTag: interaction.user.tag,
      targetTag: usuario.tag,
      detail: motivo,
    });
    await interaction.reply(`⚠️ **${usuario.tag}** recebeu um aviso: ${motivo}`);
  },
};
