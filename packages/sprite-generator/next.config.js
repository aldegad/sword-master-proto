const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  distDir: 'dist',
  // SWC minifier 사용 (Terser 대신)
  swcMinify: true,
  // ESM 패키지 트랜스파일
  transpilePackages: ['@huggingface/transformers', 'onnxruntime-web'],
  // ESM 외부 패키지 처리를 더 유연하게
  experimental: {
    esmExternals: 'loose',
  },
  // WASM 파일 지원
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // onnxruntime 호환성 문제로 minification 비활성화
    config.optimization.minimize = false;

    // onnxruntime-web을 외부 모듈로 처리 (번들링하지 않음)
    // CDN에서 WASM 파일을 직접 로드하도록 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        perf_hooks: false,
      };

      // Node.js 전용 패키지를 빈 모듈로 대체
      const emptyModule = path.resolve(__dirname, 'lib/empty-module.js');
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': emptyModule,
        'sharp': emptyModule,
      };

      // onnxruntime-web ESM 처리
      config.module.rules.push({
        test: /onnxruntime-web/,
        resolve: {
          fullySpecified: false,
        },
      });
    }

    // .node 파일 (네이티브 모듈) 무시
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });

    // WASM 파일을 asset으로 처리
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;
