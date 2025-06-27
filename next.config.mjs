/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  experimental: {
    // appDir is now default in Next.js 15, removing deprecated option
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize for Azure deployment
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    // Optimize for Azure build limits
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxSize: 244000, // 244KB for Azure Functions
      },
    };
    return config;
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '*.replit.dev'],
};

export default nextConfig;
