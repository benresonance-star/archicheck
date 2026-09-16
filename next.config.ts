import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ajv", "jszip"],
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "*.cursor.sh",
    "*.cursor.com",
  ],
};

export default nextConfig;
