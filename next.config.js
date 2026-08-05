/** @type {import('next').NextConfig} */
const nextConfig = {
  // discord.js, zlib-sync e better-sqlite3 usam módulos nativos (binários)
  // que o bundler (Turbopack) não consegue empacotar. Aqui dizemos pro
  // Next.js deixar esses pacotes de fora do bundle e carregar direto do
  // node_modules em tempo de execução no servidor.
  serverExternalPackages: ["discord.js", "zlib-sync", "better-sqlite3"],
};

export default nextConfig;
