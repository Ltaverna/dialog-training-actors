import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const here = dirname(fileURLToPath(import.meta.url));
// src/testing/ → raíz del repo: subir 4 niveles.
const rulesPath = resolve(here, '../../../../firestore.rules');

/**
 * Crea el entorno de test de Firestore cargando las reglas REALES del repo
 * (`firestore.rules`). Conecta al emulador de Firestore en 127.0.0.1:8080.
 */
export function createFirestoreTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-dialog-test',
    firestore: {
      rules: readFileSync(rulesPath, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}
