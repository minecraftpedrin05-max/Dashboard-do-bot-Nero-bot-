import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { getWarnings } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Lista os avisos de um membro")
    .addUserOption((opt) => opt.setName("usuario").setDescription("De quem ver os avisos").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");
    const avisos = getWarnings(interaction.guild.id, usuario.id);

    if (avisos.length === 0) {
      return interaction.reply({ content: `**${usuario.tag}** não tem nenhum aviso.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Avisos de ${usuario.tag}`)
      .setColor(0xf0575a)
      .setDescription(
        avisos.map((a, i) => `**${i + 1}.** ${a.reason} — <t:${Math.floor(a.created_at / 1000)}:R>`).join("\n")
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
