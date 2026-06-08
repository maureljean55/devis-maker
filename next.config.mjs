/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 est un module natif Node.js — ne pas bundler côté serveur
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
