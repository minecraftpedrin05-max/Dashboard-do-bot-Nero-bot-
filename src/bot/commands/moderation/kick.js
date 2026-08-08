import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { logActivity } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um membro do servidor")
    .addUserOption((opt) => opt.setName("usuario").setDescription("Quem expulsar").setRequired(true))
    .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo da expulsão").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Sem motivo informado";
    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!membro) {
      return interaction.reply({ content: "Não achei esse membro no servidor.", ephemeral: true });
    }
    if (!membro.kickable) {
      return interaction.reply({
        content: "Não consigo expulsar esse usuário (cargo dele é maior que o meu).",
        ephemeral: true,
      });
    }

    await membro.kick(motivo);
    logActivity(interaction.guild.id, "kick", {
      actorTag: interaction.user.tag,
      targetTag: usuario.tag,
      detail: motivo,
    });
    await interaction.reply(`👢 **${usuario.tag}** foi expulso. Motivo: ${motivo}`);
  },
};
