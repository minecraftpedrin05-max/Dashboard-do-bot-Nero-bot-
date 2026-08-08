import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Mostra informações sobre esse servidor"),

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "Esse comando só funciona dentro de um servidor.", ephemeral: true });
      return;
    }

    const guild = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 512 }))
      .addFields(
        { name: "👥 Membros", value: String(guild.memberCount), inline: true },
        { name: "🎭 Cargos", value: String(guild.roles.cache.size), inline: true },
        { name: "💬 Canais", value: String(guild.channels.cache.size), inline: true },
        { name: "😀 Emojis", value: String(guild.emojis.cache.size), inline: true },
        { name: "👑 Dono", value: `<@${guild.ownerId}>`, inline: true },
        { name: "📅 Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setColor("#5865F2");

    await interaction.reply({ embeds: [embed] });
  },
};
