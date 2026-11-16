/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ctrlpass/config', '@ctrlpass/types', '@ctrlpass/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
