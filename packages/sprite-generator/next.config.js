/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 정적 내보내기를 위한 설정
  distDir: 'dist',
  // WASM 파일 지원
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // 클라이언트에서 Node.js 모듈 폴백 처리
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // Node.js 전용 패키지를 클라이언트 번들에서 제외
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        'sharp': false,
      };
    }
    
    // .node 파일 (네이티브 모듈) 무시
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });
    
    return config;
  },
};

module.exports = nextConfig;
