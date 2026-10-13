import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les photos passent par une Server Action : la limite par défaut (1 Mo) est trop basse.
      // 4 photos de 5 Mo maximum par envoi → 20 Mo.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;