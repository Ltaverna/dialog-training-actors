import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@dialog/core` y `@dialog/data` se distribuyen como fuente TypeScript
  // dentro del monorepo; Next debe transpilarlos en lugar de tratarlos como
  // dependencias precompiladas.
  transpilePackages: ['@dialog/core', '@dialog/data'],
};

export default nextConfig;
