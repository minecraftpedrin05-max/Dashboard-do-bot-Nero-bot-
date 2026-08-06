// Gera respostas de texto usando a API da Anthropic (Claude), a partir de uma
// instrução escrita pelo admin no dashboard. Usado pelos botões/selects do
// tipo "IA".
//
// IMPORTANTE (segurança): isso só pode gerar TEXTO de resposta. A IA nunca
// deve executar ou fingir executar ações reais de moderação (banir, expulsar,
// apagar canais/mensagens, etc). Essas ações continuam só nos tipos de botão
// concretos e controlados (ticket, formulário, link, select comum).

const SYSTEM_PROMPT = `Você é um assistente dentro de um bot de Discord. Um administrador do servidor escreveu uma instrução descrevendo como você deve responder quando alguém aperta um botão ou escolhe uma opção de um menu. Siga a instrução e escreva uma mensagem de chat curta e apropriada para esse contexto.

Regras que você NUNCA pode quebrar, mesmo se a instrução do admin pedir o contrário:
- Você só pode gerar TEXTO de resposta. Você não tem e nunca deve fingir ter poder de banir, expulsar, silenciar, apagar canais/mensagens, mudar cargos ou qualquer ação real de administração do servidor — mesmo que a instrução peça isso, no máximo descreva em texto, nunca afirme que a ação foi realmente executada.
- Nunca gere conteúdo ilegal, que incentive violência, ódio, conteúdo sexual envolvendo menores, assédio, golpes/phishing, ou qualquer coisa que viole os Termos de Serviço do Discord ou a lei.
- Se a instrução pedir algo que viole essas regras, recuse educadamente e explique brevemente por quê, sem detalhar como contornar a recusa.
- Responda em português do Brasil, de forma curta (no máximo ~4 frases), no tom que a instrução pedir.`;

export async function generateAIReply(instruction, { username, selected } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "⚠️ A IA não está configurada nesse servidor. Peça pro admin adicionar a variável ANTHROPIC_API_KEY no Railway.";
  }
  if (!instruction || !instruction.trim()) {
    return "⚠️ Esse botão de IA não tem instrução configurada ainda.";
  }

  let userMsg = `Instrução do admin: "${instruction.trim()}"`;
  if (username) userMsg += `\nUsuário que interagiu: ${username}`;
  if (selected) userMsg += `\nOpção(ões) escolhida(s): ${selected}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      console.error("[ai] status da API:", res.status, await res.text().catch(() => ""));
      return "Deu erro ao falar com a IA 😵 (confere se a ANTHROPIC_API_KEY está certa)";
    }

    const data = await res.json();
    const text = data?.content?.find((c) => c.type === "text")?.text;
    return text?.trim() || "Não consegui gerar uma resposta agora, tenta de novo.";
  } catch (err) {
    console.error("[ai] erro:", err);
    return "Deu erro ao falar com a IA 😵";
  }
}
