import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { logActivity } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia um membro por um tempo (timeout)")
    .addUserOption((opt) => opt.setName("usuario").setDescription("Quem silenciar").setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName("minutos").setDescription("Duração em minutos").setRequired(true).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");
    const minutos = interaction.options.getInteger("minutos");
    const motivo = interaction.options.getString("motivo") || "Sem motivo informado";
    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!membro) {
      return interaction.reply({ content: "Não achei esse membro no servidor.", ephemeral: true });
    }
    if (!membro.moderatable) {
      return interaction.reply({ content: "Não consigo silenciar esse usuário.", ephemeral: true });
    }

    await membro.timeout(minutos * 60 * 1000, motivo);
    logActivity(interaction.guild.id, "mute", {
      actorTag: interaction.user.tag,
      targetTag: usuario.tag,
      detail: `${motivo} (${minutos}min)`,
    });
    await interaction.reply(`🔇 **${usuario.tag}** foi silenciado por ${minutos} minuto(s). Motivo: ${motivo}`);
  },
};
