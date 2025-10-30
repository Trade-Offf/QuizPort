/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 仅在浏览器端避免解析到 Prisma/Node-only 依赖
      config.resolve.alias['@prisma/client'] = false;
      config.resolve.alias['@prisma/extension-accelerate'] = false;
      config.resolve.alias['prisma'] = false;
      config.resolve.alias['@/lib/prisma'] = false;
      // 避免浏览器端/Edge 构建中解析到仅用于 Node/React Native 的依赖
      config.resolve.alias['pino-pretty'] = false;
      config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    }
    return config;
  },
};

export default nextConfig;

