import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
  ],
  serverActions: {
    bodySizeLimit: "4mb",
  },
};

export default nextConfig;
