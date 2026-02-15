/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
