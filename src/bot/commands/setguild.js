import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("colocar")
    .setDescription("Configure o servidor onde você quer criar comandos personalizados"),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("modal_set_guild")
      .setTitle("Configurar Servidor");

    const guildIdInput = new TextInputBuilder()
      .setCustomId("guild_id_input")
      .setLabel("ID do Servidor (clique direito > Copiar ID)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("ex: 1234567890")
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(guildIdInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
