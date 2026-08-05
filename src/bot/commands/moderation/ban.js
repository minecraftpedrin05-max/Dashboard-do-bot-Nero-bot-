import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um membro do servidor")
    .addUserOption((opt) => opt.setName("usuario").setDescription("Quem banir").setRequired(true))
    .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo do banimento").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Sem motivo informado";
    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (membro && !membro.bannable) {
      return interaction.reply({
        content: "Não consigo banir esse usuário (cargo dele é maior que o meu).",
        ephemeral: true,
      });
    }

    await interaction.guild.members.ban(usuario.id, { reason: motivo });
    await interaction.reply(`🔨 **${usuario.tag}** foi banido. Motivo: ${motivo}`);
  },
};
