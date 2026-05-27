import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "scontent.xx.fbcdn.net" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
  },
};

export default nextConfig;
