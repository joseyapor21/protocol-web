import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "192.168.8.141",
    "192.168.8.254",
    "192.168.3.1",
    "localhost",
  ],
};

export default nextConfig;
