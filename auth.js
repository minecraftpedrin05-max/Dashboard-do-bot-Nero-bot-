import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { getUserGuild } from "./src/lib/db.js";

const MANAGE_GUILD = 0x20n;
const ADMINISTRATOR = 0x8n;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  callbacks: {
    // Ao logar, busca qual servidor o usuário configurou e verifica permissões
    async jwt({ token, account }) {
      if (account?.access_token) {
        try {
          const userGuild = getUserGuild(token.sub);
          console.log("[DEBUG] token.sub:", token.sub);
          console.log("[DEBUG] userGuild retornado do banco:", userGuild);

          if (!userGuild) {
            console.log("[DEBUG] userGuild é null/vazio -> acesso negado aqui");
            token.isServerAdmin = false;
            token.userGuild = null;
            return token;
          }

          const res = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          console.log("[DEBUG] status da resposta /users/@me/guilds:", res.status);
          const guilds = await res.json();
          console.log("[DEBUG] guilds retornados:", JSON.stringify(guilds).slice(0, 2000));

          const target = Array.isArray(guilds) ? guilds.find((g) => g.id === userGuild) : null;
          console.log("[DEBUG] servidor alvo encontrado na lista?", !!target);
          if (target) console.log("[DEBUG] permissions do target:", target.permissions, "owner:", target.owner);

          const perms = target ? BigInt(target.permissions) : 0n;
          token.isServerAdmin =
            !!target && ((perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR);
          console.log("[DEBUG] isServerAdmin final:", token.isServerAdmin);
          token.userGuild = userGuild;
        } catch (err) {
          console.error("[auth] falha ao checar permissões:", err);
          token.isServerAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.isServerAdmin = token.isServerAdmin ?? false;
      session.userGuild = token.userGuild ?? null;
      return session;
    },
  },
});
