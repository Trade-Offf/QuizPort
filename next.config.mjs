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
      // 避免浏览器端解析 pdf.js-extract (仅用于服务端)
      config.resolve.alias['pdf.js-extract'] = false;
    }

    // 允许 pdf-parse 在服务端使用 canvas (可选依赖)
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas');
    }

    return config;
  },
};

export default nextConfig;

