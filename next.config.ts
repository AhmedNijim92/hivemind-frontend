import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const apiGatewayUrl = process.env.API_GATEWAY_INTERNAL_URL || "http://api-gateway:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "api-gateway" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Proxy /api/v1/* to the API gateway (server-side, within the cluster).
  // This allows NEXT_PUBLIC_API_URL to be empty (relative) so that
  // browser requests go to the same origin, then Next.js proxies them
  // to the gateway internally. Configurable via API_GATEWAY_INTERNAL_URL env var.
  // Uses beforeFiles so the rewrite fires before Next.js checks for matching routes.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${apiGatewayUrl}/api/v1/:path*`,
        },
        {
          source: "/ws/:path*",
          destination: `${apiGatewayUrl}/ws/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // Prevent source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
