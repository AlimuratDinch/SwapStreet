import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // This is the key for Local Staging
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
        hostname: "minio", // Internal Docker name for server-side optimization
        port: "9000",
      },
      // If your staging Nginx uses a domain via hosts file
      {
        protocol: "http",
        hostname: "minio.swapstreet.ca",
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
  skipTrailingSlashRedirect: true,
  serverComponentsExternalPackages: ["tslog"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
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