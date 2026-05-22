import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 15000,
    // Los emuladores de Firebase son compartidos: si vitest corre archivos de
    // test en paralelo, el `clearFirestore()` de un archivo pisa los datos
    // que otro acaba de escribir.
    fileParallelism: false,
  },
});
