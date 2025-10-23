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
      // 避免浏览器端/Edge 构建中解析到仅用于 Node/React Native 的依赖
      config.resolve.alias['pino-pretty'] = false;
      config.resolve.alias['@react-native-async-storage/async-storage'] = false;
    }
    return config;
  },
};

export default nextConfig;

