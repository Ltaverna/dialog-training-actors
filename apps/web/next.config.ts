import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@dialog/core` se distribuye como fuente TypeScript dentro del monorepo;
  // Next debe transpilarlo en lugar de tratarlo como dependencia precompilada.
  transpilePackages: ['@dialog/core'],
};

export default nextConfig;
