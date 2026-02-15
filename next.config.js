/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  ...(isDev
    ? {}
    : {
        output: 'export',
        distDir: 'dist',
      }),
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
