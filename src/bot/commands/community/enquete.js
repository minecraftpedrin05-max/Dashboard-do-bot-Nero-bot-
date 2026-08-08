import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default {
  data: new SlashCommandBuilder()
    .setName("enquete")
    .setDescription("Cria uma enquete pra galera votar reagindo")
    .addStringOption((opt) => opt.setName("pergunta").setDescription("A pergunta da enquete").setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName("opcoes")
        .setDescription("Opções separadas por vírgula (2 a 10). Deixe vazio pra enquete sim/não")
        .setRequired(false)
    ),

  async execute(interaction) {
    const pergunta = interaction.options.getString("pergunta");
    const opcoesRaw = interaction.options.getString("opcoes");

    const opcoes = opcoesRaw
      ? opcoesRaw
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
          .slice(0, 10)
      : null;

    if (opcoes && opcoes.length < 2) {
      return interaction.reply({ content: "Me dá pelo menos 2 opções separadas por vírgula.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${pergunta}`)
      .setColor(0x5865f2)
      .setFooter({ text: `Enquete criada por ${interaction.user.tag}` })
      .setTimestamp();

    if (opcoes) {
      embed.setDescription(opcoes.map((o, i) => `${NUMBER_EMOJIS[i]} ${o}`).join("\n"));
    }

    const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

    if (opcoes) {
      for (let i = 0; i < opcoes.length; i++) {
        await reply.react(NUMBER_EMOJIS[i]).catch(() => {});
      }
    } else {
      await reply.react("👍").catch(() => {});
      await reply.react("👎").catch(() => {});
    }
  },
};
