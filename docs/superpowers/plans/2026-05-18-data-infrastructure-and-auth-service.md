# Infraestructura de Datos y Servicio de Autenticación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el paquete `@dialog/data` con la inicialización de Firebase y el servicio de autenticación (email/contraseña y credenciales sociales), testeado contra el emulador de Auth de Firebase.

**Architecture:** `@dialog/data` es el único paquete del monorepo que importa el SDK `firebase`. Esta primera entrega cubre la capa agnóstica de framework: `initFirebase()` y `authService` (funciones de auth). Los tests corren con Vitest dentro de `firebase emulators:exec`, que levanta el emulador de Auth (proceso Node, no requiere Java). El contexto/hooks de React, los repositorios de Firestore y las reglas de seguridad van en planes posteriores.

**Tech Stack:** Firebase JS SDK v11, Firebase Emulator Suite (emulador de Auth), Vitest, TypeScript, pnpm, Turborepo.

**Contexto del proyecto:** Primer sub-proyecto del spec `docs/superpowers/specs/2026-05-18-data-layer-and-auth-design.md`. El monorepo ya tiene `packages/core` (`@dialog/core`), `apps/web` y `apps/mobile`. El directorio raíz es `/Users/lucas/Documents/Proyectos/dialog-training-actors`. El CLI `firebase` está instalado globalmente (v15.x) y logueado como `taverna.lucas@gmail.com`.

**Proyecto Firebase ya aprovisionado:**
- Project ID: `dialog-training-actors`
- Web app registrada — config del SDK:
  - `apiKey`: `AIzaSyDU-IB0_dczoQQ6jxPlXgZC4znkU1Yq3qI`
  - `authDomain`: `dialog-training-actors.firebaseapp.com`
  - `projectId`: `dialog-training-actors`
  - `storageBucket`: `dialog-training-actors.firebasestorage.app`
  - `messagingSenderId`: `294762757129`
  - `appId`: `1:294762757129:web:7e7351fc9fbdc8eebb0cd8`
  
  (Esta config NO es secreta — viaja en el bundle del cliente. Las apps la consumirán por variables de entorno en un plan posterior; este plan no toca las apps.)

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `.firebaserc` | Asocia el directorio al proyecto Firebase `dialog-training-actors` |
| `firebase.json` | Configuración de la Emulator Suite (puertos de Auth y Firestore) |
| `packages/data/package.json` | Manifiesto de `@dialog/data` |
| `packages/data/tsconfig.json` | Config TS, extiende la base del monorepo |
| `packages/data/vitest.config.ts` | Config del runner de tests |
| `packages/data/src/firebase.ts` | `initFirebase()`: inicializa la app y los handles de Auth y Firestore |
| `packages/data/src/auth/authService.ts` | Funciones de autenticación (email y social) |
| `packages/data/src/auth/authService.test.ts` | Tests del servicio de auth contra el emulador |
| `packages/data/src/index.ts` | API pública del paquete |

---

## Task 1: Configuración de Firebase en la raíz del repo

**Files:**
- Create: `.firebaserc`
- Create: `firebase.json`

- [ ] **Step 1: Crear `.firebaserc`**

Crear `.firebaserc` en la raíz del repo:

```json
{
  "projects": {
    "default": "dialog-training-actors"
  }
}
```

- [ ] **Step 2: Crear `firebase.json`**

Crear `firebase.json` en la raíz del repo. Solo configura los emuladores (las reglas de Firestore se agregan en un plan posterior):

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": false
    },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 3: Verificar que la config del emulador es válida**

Run: `firebase emulators:exec --only auth --project demo-dialog-test "echo emulator-ok"`
Expected: el emulador de Auth arranca, imprime `emulator-ok` y se apaga sin errores. (La primera corrida puede descargar el emulador de Auth — es un proceso Node, no requiere Java.)

- [ ] **Step 4: Commit**

```bash
git add .firebaserc firebase.json
git commit -m "chore: add firebase project config and emulator setup"
```

---

## Task 2: Scaffold del paquete `@dialog/data`

**Files:**
- Create: `packages/data/package.json`
- Create: `packages/data/tsconfig.json`
- Create: `packages/data/vitest.config.ts`
- Create: `packages/data/src/index.ts`
- Test: `packages/data/src/sanity.test.ts`

- [ ] **Step 1: Crear el manifiesto del paquete**

Crear `packages/data/package.json`:

```json
{
  "name": "@dialog/data",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "firebase emulators:exec --only auth --project demo-dialog-test 'vitest run'",
    "test:watch": "firebase emulators:exec --only auth --project demo-dialog-test 'vitest'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dialog/core": "workspace:*",
    "firebase": "^11.3.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

Nota: el script `test` usa el CLI `firebase` global para levantar el emulador de Auth alrededor de Vitest. El prefijo `demo-` en `--project demo-dialog-test` hace que el emulador corra en modo demo (sin credenciales, sin tocar el proyecto real).

- [ ] **Step 2: Crear la config TypeScript**

Crear `packages/data/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": false
  },
  "include": ["src"]
}
```

(`declaration: false` porque el paquete se consume como fuente y nunca emite `.d.ts`; evita errores TS2742 al re-exportar tipos del SDK `firebase`.)

- [ ] **Step 3: Crear la config de Vitest**

Crear `packages/data/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 15000,
  },
});
```

- [ ] **Step 4: Crear el punto de entrada**

Crear `packages/data/src/index.ts`:

```ts
// La API pública se completa en las tareas siguientes.
export {};
```

- [ ] **Step 5: Crear un test de sanidad**

Crear `packages/data/src/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('configuración de @dialog/data', () => {
  it('ejecuta tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Instalar y correr el test de sanidad**

Run: `pnpm install`
Then: `pnpm --filter @dialog/data test`
Expected: PASS — `firebase emulators:exec` levanta el emulador de Auth, Vitest corre 1 test que pasa, el emulador se apaga.

- [ ] **Step 7: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add packages/data pnpm-lock.yaml
git commit -m "chore: scaffold @dialog/data package with emulator-backed vitest"
```

---

## Task 3: Inicialización de Firebase (`firebase.ts`)

**Files:**
- Create: `packages/data/src/firebase.ts`
- Modify: `packages/data/src/index.ts`

- [ ] **Step 1: Implementar `initFirebase`**

Crear `packages/data/src/firebase.ts`:

```ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

/** Config del SDK web de Firebase. No es secreta: viaja en el cliente. */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/** Handles de Firebase listos para usar. */
export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/** Opciones de inicialización. Si se pasan emuladores, conecta a los locales. */
export interface InitFirebaseOptions {
  emulators?: {
    /** URL del emulador de Auth, ej. 'http://127.0.0.1:9099'. */
    authUrl?: string;
    /** Host y puerto del emulador de Firestore. */
    firestore?: { host: string; port: number };
  };
}

/**
 * Inicializa la app de Firebase y devuelve los handles de Auth y Firestore.
 * Si `options.emulators` está definido, conecta los servicios indicados a los
 * emuladores locales.
 */
export function initFirebase(
  config: FirebaseConfig,
  options: InitFirebaseOptions = {},
): FirebaseServices {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const emulators = options.emulators;
  if (emulators?.authUrl !== undefined) {
    connectAuthEmulator(auth, emulators.authUrl, { disableWarnings: true });
  }
  if (emulators?.firestore !== undefined) {
    connectFirestoreEmulator(
      db,
      emulators.firestore.host,
      emulators.firestore.port,
    );
  }

  return { app, auth, db };
}
```

- [ ] **Step 2: Exportar la API pública**

Reemplazar el contenido completo de `packages/data/src/index.ts` por:

```ts
export { initFirebase } from './firebase';
export type {
  FirebaseConfig,
  FirebaseServices,
  InitFirebaseOptions,
} from './firebase';
```

- [ ] **Step 3: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add initFirebase with emulator support"
```

---

## Task 4: Servicio de autenticación — email y contraseña

**Files:**
- Create: `packages/data/src/auth/authService.ts`
- Test: `packages/data/src/auth/authService.test.ts`
- Modify: `packages/data/src/index.ts`
- Delete: `packages/data/src/sanity.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `packages/data/src/auth/authService.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import type { User } from 'firebase/auth';
import { initFirebase, type FirebaseServices } from '../firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  sendPasswordReset,
  observeAuthState,
} from './authService';

const DEMO_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-dialog-test.firebaseapp.com',
  projectId: 'demo-dialog-test',
  storageBucket: 'demo-dialog-test.appspot.com',
  messagingSenderId: '0',
  appId: 'demo-app-id',
};

let services: FirebaseServices;

beforeAll(() => {
  services = initFirebase(DEMO_CONFIG, {
    emulators: { authUrl: 'http://127.0.0.1:9099' },
  });
});

function uniqueEmail(): string {
  return `actor-${crypto.randomUUID()}@example.com`;
}

describe('signUpWithEmail', () => {
  it('crea un usuario nuevo con el email sin verificar', async () => {
    const user = await signUpWithEmail(
      services.auth,
      uniqueEmail(),
      'secret123',
    );
    expect(user.email).toMatch(/@example\.com$/);
    expect(user.emailVerified).toBe(false);
  });

  it('rechaza un email ya registrado', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      signUpWithEmail(services.auth, email, 'secret123'),
    ).rejects.toThrow();
  });
});

describe('signInWithEmail', () => {
  it('inicia sesión con las credenciales correctas', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await signOutCurrentUser(services.auth);
    const user = await signInWithEmail(services.auth, email, 'secret123');
    expect(user.email).toBe(email);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      signInWithEmail(services.auth, email, 'contraseña-incorrecta'),
    ).rejects.toThrow();
  });
});

describe('signOutCurrentUser', () => {
  it('deja sin usuario actual después de cerrar sesión', async () => {
    await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    expect(services.auth.currentUser).not.toBeNull();
    await signOutCurrentUser(services.auth);
    expect(services.auth.currentUser).toBeNull();
  });
});

describe('sendPasswordReset', () => {
  it('resuelve para un email registrado', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      sendPasswordReset(services.auth, email),
    ).resolves.toBeUndefined();
  });
});

describe('observeAuthState', () => {
  it('notifica el usuario actual al suscribirse', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    const user = await new Promise<User | null>((resolve) => {
      const unsubscribe = observeAuthState(services.auth, (u) => {
        unsubscribe();
        resolve(u);
      });
    });
    expect(user?.email).toBe(email);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver el módulo `./authService`.

- [ ] **Step 3: Implementar las funciones de auth con email**

Crear `packages/data/src/auth/authService.ts`:

```ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';

/**
 * Registra un usuario nuevo con email y contraseña, y le envía el email de
 * verificación. La sesión queda iniciada. Devuelve el usuario creado.
 */
export async function signUpWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await sendEmailVerification(credential.user);
  return credential.user;
}

/** Inicia sesión con email y contraseña. Devuelve el usuario. */
export async function signInWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Cierra la sesión actual. */
export function signOutCurrentUser(auth: Auth): Promise<void> {
  return signOut(auth);
}

/** Envía el email de reseteo de contraseña a la dirección dada. */
export function sendPasswordReset(auth: Auth, email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Observa los cambios del estado de sesión. El callback recibe el usuario
 * actual o `null`. Devuelve una función para desuscribirse.
 */
export function observeAuthState(
  auth: Auth,
  callback: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
```

- [ ] **Step 4: Borrar el test de sanidad y exportar la API pública**

Eliminar `packages/data/src/sanity.test.ts`.

Agregar al final de `packages/data/src/index.ts`:

```ts
export {
  signUpWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  sendPasswordReset,
  observeAuthState,
} from './auth/authService';
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los tests de `authService` pasan contra el emulador de Auth.

- [ ] **Step 6: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add email/password auth service"
```

---

## Task 5: Servicio de autenticación — credenciales sociales

**Files:**
- Modify: `packages/data/src/auth/authService.ts`
- Modify: `packages/data/src/index.ts`

Las funciones sociales son envoltorios delgados y tipados sobre el SDK
`firebase`. NO se testean con runtime en este plan: `signInWith*Popup`
requiere un navegador, y los flujos por credencial requieren un token OAuth
real cuyo formato exacto depende del proveedor. Se verifican por `typecheck`.
Sus caminos se ejercitan en los planes de UI web y móvil (pruebas manuales y
end-to-end). Esto es una decisión consciente, no un placeholder.

- [ ] **Step 1: Implementar las funciones de auth social**

Agregar al final de `packages/data/src/auth/authService.ts`:

```ts
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';

/** Web: inicia sesión con Google mediante un popup. Devuelve el usuario. */
export async function signInWithGooglePopup(auth: Auth): Promise<User> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

/** Web: inicia sesión con Apple mediante un popup. Devuelve el usuario. */
export async function signInWithApplePopup(auth: Auth): Promise<User> {
  const result = await signInWithPopup(auth, new OAuthProvider('apple.com'));
  return result.user;
}

/**
 * Móvil: inicia sesión con un `idToken` de Google obtenido por el flujo
 * nativo de la app (ej. `expo-auth-session`). Devuelve el usuario.
 */
export async function signInWithGoogleIdToken(
  auth: Auth,
  idToken: string,
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/**
 * Móvil: inicia sesión con la credencial de Apple obtenida por el flujo
 * nativo de la app (ej. `expo-apple-authentication`). `rawNonce` es el nonce
 * sin hashear usado al pedir la credencial. Devuelve el usuario.
 */
export async function signInWithAppleIdToken(
  auth: Auth,
  params: { idToken: string; rawNonce: string },
): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: params.idToken,
    rawNonce: params.rawNonce,
  });
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
```

- [ ] **Step 2: Exportar la API pública**

Agregar al final de `packages/data/src/index.ts`:

```ts
export {
  signInWithGooglePopup,
  signInWithApplePopup,
  signInWithGoogleIdToken,
  signInWithAppleIdToken,
} from './auth/authService';
```

- [ ] **Step 3: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Correr la suite para confirmar que nada se rompió**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los tests de `authService` (email) siguen pasando.

- [ ] **Step 5: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add social sign-in (Google/Apple) to auth service"
```

---

## Task 6: Verificación del monorepo completo

**Files:**
- (ninguno — solo verificación)

- [ ] **Step 1: Verificar la suite completa del monorepo**

Run: `pnpm install`
Then: `pnpm test`
Expected: PASS — Turborepo corre los tests de `@dialog/core`, `@dialog/web`, `@dialog/mobile` y `@dialog/data`; todos verdes. (`@dialog/data` levanta el emulador de Auth.)

Then: `pnpm typecheck`
Expected: `Tasks: 4 successful, 4 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito.

- [ ] **Step 2: Commit (si `pnpm install` actualizó el lockfile)**

Si `git status` muestra cambios en `pnpm-lock.yaml`:

```bash
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

Si no hay cambios, omitir este commit.

---

## Verificación final

Al terminar las 6 tareas:

- `.firebaserc` y `firebase.json` configuran el proyecto y la Emulator Suite.
- `@dialog/data` existe con `initFirebase()` y el `authService` completo
  (email + social), exportados desde `src/index.ts`.
- `pnpm --filter @dialog/data test` corre Vitest dentro del emulador de Auth y
  pasa.
- `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes desde la raíz.

Esto deja lista la infraestructura de datos y el servicio de auth. El plan
siguiente agregará los repositorios de Firestore (`userRepository`,
`scriptRepository`), las reglas de seguridad y sus tests (que sí requieren el
emulador de Firestore y, por lo tanto, Java).

---

## Self-Review

**Cobertura del spec:** Este plan implementa la primera parte del sub-proyecto 1 de la sección 12 del spec (`@dialog/data` + emuladores): el paquete, la inicialización de Firebase (sección 4.1) y el servicio de autenticación con los tres proveedores (secciones 4.2 y 7 — funciones de email y sociales). Quedan explícitamente para el plan siguiente, como indica la verificación final: los repositorios de Firestore y el mapeo `Script`↔Firestore (sección 6), las reglas de seguridad (sección "Reglas de seguridad") y sus tests. El contexto/hooks de React (`AuthProvider`/`useAuth`) van con los planes de UI. La persistencia offline se configura cuando las apps integren Firestore. Sin huecos dentro del alcance declarado.

**Placeholders:** No hay TODOs ni pasos sin contenido. La Task 5 declara explícitamente que las funciones sociales se verifican por `typecheck` (no por runtime) y explica por qué — es una decisión consciente documentada, no un placeholder.

**Consistencia de tipos:** `FirebaseConfig`, `FirebaseServices`, `InitFirebaseOptions` se definen en `firebase.ts` (Task 3) y se reexportan en `index.ts`. `initFirebase` mantiene la misma firma en su definición, su uso en los tests (Task 4) y su exportación. Las funciones de `authService` (`signUpWithEmail`, `signInWithEmail`, `signOutCurrentUser`, `sendPasswordReset`, `observeAuthState`, y las 4 sociales) usan los mismos nombres y firmas en su implementación, sus tests y `index.ts`. Todas toman `auth: Auth` como primer parámetro de forma consistente.
