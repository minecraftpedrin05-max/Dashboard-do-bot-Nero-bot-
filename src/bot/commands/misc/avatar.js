import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Mostra a foto de perfil de alguém (ou a sua)")
    .addUserOption((opt) => opt.setName("usuario").setDescription("De quem você quer ver a foto")),

  async execute(interaction) {
    const user = interaction.options.getUser("usuario") || interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(`Foto de perfil de ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024, extension: "png" }))
      .setColor("#5865F2");

    await interaction.reply({ embeds: [embed] });
  },
};
