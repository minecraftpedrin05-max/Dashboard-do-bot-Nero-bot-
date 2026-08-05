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
          if (!userGuild) {
            token.isServerAdmin = false;
            token.userGuild = null;
            return token;
          }

          const res = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          const guilds = await res.json();
          const target = Array.isArray(guilds) ? guilds.find((g) => g.id === userGuild) : null;

          const perms = target ? BigInt(target.permissions) : 0n;
          token.isServerAdmin =
            !!target && ((perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR);
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
