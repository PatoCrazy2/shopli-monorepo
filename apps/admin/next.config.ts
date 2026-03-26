import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    // Si no está definido POS_APP_URL, permite localhost para dev o comodín si quieres APIs abiertas
    const allowedOrigin = process.env.POS_APP_URL || "http://localhost:5173";

    return [
      {
        source: "/api/pos/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: allowedOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS, PUT, PATCH, DELETE" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-pos-sync-secret" },
        ],
      },
    ];
  },
};

export default nextConfig;
