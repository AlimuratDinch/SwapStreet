import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
      const webpack = require("webpack");
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^tslog$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
