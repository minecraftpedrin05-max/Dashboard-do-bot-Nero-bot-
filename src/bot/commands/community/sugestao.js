import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getSettings } from "../../../lib/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sugestao")
    .setDescription("Envia uma sugestão pro canal de sugestões do servidor")
    .addStringOption((opt) => opt.setName("texto").setDescription("Sua sugestão").setRequired(true)),

  async execute(interaction) {
    const settings = getSettings(interaction.guild.id);

    if (!settings.suggestions_channel_id) {
      return interaction.reply({
        content: "Esse servidor ainda não configurou um canal de sugestões. Peça pra um admin configurar no dashboard.",
        ephemeral: true,
      });
    }

    const channel = interaction.guild.channels.cache.get(settings.suggestions_channel_id);
    if (!channel) {
      return interaction.reply({
        content: "O canal de sugestões configurado não existe mais. Avisa um admin.",
        ephemeral: true,
      });
    }

    const texto = interaction.options.getString("texto").slice(0, 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(texto)
      .setColor(0xf5a623)
      .setFooter({ text: "💡 Sugestão" })
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react("👍").catch(() => {});
    await msg.react("👎").catch(() => {});

    await interaction.reply({ content: `✅ Sugestão enviada em ${channel}!`, ephemeral: true });
  },
};
