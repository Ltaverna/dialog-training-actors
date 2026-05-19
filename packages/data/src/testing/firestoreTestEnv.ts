import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase/firestore';

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

/**
 * Devuelve un handle `Firestore` modular autenticado como `uid`.
 *
 * `@firebase/rules-unit-testing` declara que `ctx.firestore()` devuelve el
 * `Firestore` del namespace compat de Firebase. En tiempo de ejecución es
 * compatible con la SDK modular, pero los tipos no son estructuralmente
 * equivalentes. Este helper acota el casteo a un solo lugar.
 */
export function authedFirestore(
  env: RulesTestEnvironment,
  uid: string,
): Firestore {
  return env.authenticatedContext(uid).firestore() as unknown as Firestore;
}

/** Igual que `authedFirestore` pero sin autenticar (para tests de reglas). */
export function unauthedFirestore(env: RulesTestEnvironment): Firestore {
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}
