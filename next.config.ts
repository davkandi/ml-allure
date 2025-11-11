import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

// CRITICAL FIX: Disable all caching to force complete rebuild after toast system migration
const nextConfig: NextConfig = {
  // TEMPORARY: Disable caching to clear HMR corruption
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression and optimization
  compress: true,
  
  // Production optimizations
  swcMinify: true,
  
  // Experimental features for optimization
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
    ],
    scrollRestoration: true,
  },
  
  // Output configuration
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  },
  
  // Webpack configuration for production optimization
  webpack: (config, { isServer }) => {
    // TEMPORARY: Disable all webpack caching to force rebuild
    config.cache = false;
    
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            ui: {
              name: 'ui',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            admin: {
              name: 'admin',
              test: /[\\/]src[\\/](app|components)[\\/](admin|\\(admin\\))/,
              chunks: 'all',
              priority: 25,
            },
            customer: {
              name: 'customer',
              test: /[\\/]src[\\/](app|components)[\\/](customer|\\(customer\\))/,
              chunks: 'all',
              priority: 25,
            },
            pos: {
              name: 'pos',
              test: /[\\/]src[\\/](app|components)[\\/](pos|\\(pos\\))/,
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
// Orchids restart: 1761302678409