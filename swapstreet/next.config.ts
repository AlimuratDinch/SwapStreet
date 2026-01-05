import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  serverComponentsExternalPackages: ["tslog"],
  webpack: (config, { isServer }) => {
    // Prevent tslog from being bundled in client-side code
    if (!isServer) {
      // Use IgnorePlugin to completely ignore tslog in client bundles
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^tslog$/,
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
