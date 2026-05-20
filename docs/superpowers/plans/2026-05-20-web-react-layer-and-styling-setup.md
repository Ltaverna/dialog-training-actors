# Setup de Estilos + Capa React de `@dialog/data` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar `apps/web` con Tailwind + shadcn/ui instalados, conectada a Firebase vía variables de entorno (con flag opcional para emuladores), y agregar a `@dialog/data` la capa React (`<FirebaseProvider>`, `<AuthProvider>`, `useAuth`, `useScripts`) que consumen las pantallas de los planes siguientes.

**Architecture:** El paquete `@dialog/data` se mantiene como único punto de entrada al SDK `firebase`; ahora suma una sub-carpeta `react/` con los providers y hooks. `apps/web` se queda con dos archivos finos en `lib/` (init de Firebase desde env vars + mapper de errores en español) y un wrapper cliente `<Providers>` que monta los proveedores. La home pasa a una pantalla mínima por status (`loading` / `signedOut` / `signedIn`) — las pantallas reales llegan en los planes 2 y 3.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS (v4 via shadcn CLI), shadcn/ui, React 19, react-hook-form + zod (instalados por shadcn al sumar `form`), `firebase` JS SDK v11, `@firebase/rules-unit-testing` (ya en el monorepo), Vitest + @testing-library/react + jsdom (jsdom solo para los tests de hooks de `@dialog/data`).

**Contexto del proyecto:** Primer sub-proyecto del spec `docs/superpowers/specs/2026-05-20-web-auth-ui-design.md`. El monorepo tiene `packages/core`, `packages/data` (con `initFirebase`, servicio de auth, repositorios y tests contra emuladores), `apps/web` (Next 15, sin estilos todavía) y `apps/mobile`. El proyecto Firebase `dialog-training-actors` ya existe; la web app está registrada con `appId 1:294762757129:web:7e7351fc9fbdc8eebb0cd8`.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `apps/web/components.json` | Config de shadcn |
| `apps/web/app/globals.css` (modif.) | Directivas Tailwind + tokens shadcn |
| `apps/web/postcss.config.mjs` (creado/modif. por shadcn) | PostCSS plugin para Tailwind |
| `apps/web/tailwind.config.ts` (si shadcn lo crea) | Config de Tailwind |
| `apps/web/components/ui/*` | Componentes shadcn (button, input, label, form, card, tabs, sonner) |
| `apps/web/package.json` (modif.) | Sumar `@dialog/data` como dep + deps que arrastran shadcn (rhf, zod, sonner, etc.) |
| `apps/web/next.config.ts` (modif.) | `transpilePackages: ['@dialog/core', '@dialog/data']` |
| `apps/web/.env.local.example` | Variables `NEXT_PUBLIC_FIREBASE_*` con valores reales |
| `apps/web/lib/firebase.ts` | Wrapper de `initFirebase` que lee env vars y soporta flag de emulador |
| `apps/web/lib/firebase-errors.ts` | Mapper de códigos `auth/*` y `firestore/*` a mensajes en español |
| `apps/web/lib/firebase-errors.test.ts` | Tests del mapper |
| `apps/web/vitest.config.mts` (modif.) | Sumar `lib/**/*.test.ts` al `include` |
| `apps/web/app/providers.tsx` | Client wrapper que monta `<FirebaseProvider>` + `<AuthProvider>` + `<Toaster>` |
| `apps/web/app/layout.tsx` (modif.) | Importa `globals.css` + envuelve con `<Providers>` |
| `apps/web/app/page.tsx` (modif.) | Placeholder por status (`loading` / `signedOut` / `signedIn`) |
| `apps/web/app/page.test.tsx` (eliminado) | El test del demo deja de aplicar; los tests reales vienen en planes 2 y 3 |
| `packages/data/package.json` (modif.) | Sumar `react`/`react-dom` como peerDeps; jsdom + RTL como devDeps |
| `packages/data/src/react/FirebaseProvider.tsx` | Context + `useFirebase` hook |
| `packages/data/src/react/AuthProvider.tsx` | Observa `onAuthStateChanged`, dispara `ensureUserProfile`, expone acciones |
| `packages/data/src/react/useAuth.ts` | Hook tipado `{ user, status, ...acciones }` |
| `packages/data/src/react/useScripts.ts` | Subscripción en vivo (`onSnapshot`) a los guiones del usuario + acciones |
| `packages/data/src/react/*.test.tsx` | Tests con jsdom + RTL contra los emuladores |
| `packages/data/src/index.ts` (modif.) | Re-exporta la API React |

---

## Task 1: Tailwind + shadcn/ui en `apps/web`

**Files:**
- Create: `apps/web/components.json`, `apps/web/postcss.config.mjs`, `apps/web/components/ui/*`
- Modify: `apps/web/app/globals.css`, `apps/web/package.json`, `apps/web/app/layout.tsx`

- [ ] **Step 1: Inicializar shadcn en `apps/web` con defaults**

Desde la raíz del repo:

```bash
cd apps/web && npx shadcn@latest init -d --yes
```

`-d` (defaults) elige: style `default`, base color `neutral`, css variables `true`. Esto:
- Instala Tailwind v4 y sus deps (`tailwindcss`, `@tailwindcss/postcss`, `postcss`, `tw-animate-css`).
- Crea/sobrescribe `apps/web/postcss.config.mjs`.
- Reescribe `apps/web/app/globals.css` con `@import "tailwindcss"` y las variables CSS de shadcn (light + dark).
- Crea `apps/web/components.json` (config de shadcn) y `apps/web/lib/utils.ts` (helper `cn`).
- Modifica `apps/web/app/layout.tsx` si hace falta (suma classes a `<body>`).

- [ ] **Step 2: Agregar los componentes que vamos a usar**

```bash
cd apps/web && npx shadcn@latest add --yes button input label card tabs sonner form
```

Esto baja a `apps/web/components/ui/` los componentes y suma sus dependencias (entre ellas `react-hook-form`, `zod`, `@hookform/resolvers`, `sonner`, `@radix-ui/*`).

- [ ] **Step 3: Verificar que la app sigue compilando**

Run: `pnpm install`
Then: `pnpm --filter @dialog/web build`
Expected: `next build` termina con éxito (`✓ Compiled successfully`).

Then: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "chore(web): set up Tailwind v4 and shadcn/ui"
```

---

## Task 2: Conectar `@dialog/data` con `apps/web`

**Files:**
- Modify: `apps/web/package.json`, `apps/web/next.config.ts`

- [ ] **Step 1: Sumar `@dialog/data` como dependencia**

Editar `apps/web/package.json` y agregar dentro de `dependencies`:

```json
    "@dialog/data": "workspace:*"
```

- [ ] **Step 2: Sumar `@dialog/data` a `transpilePackages` en `next.config.ts`**

Reemplazar el contenido completo de `apps/web/next.config.ts` por:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@dialog/core` y `@dialog/data` se distribuyen como fuente TypeScript
  // dentro del monorepo; Next debe transpilarlos en lugar de tratarlos como
  // dependencias precompiladas.
  transpilePackages: ['@dialog/core', '@dialog/data'],
};

export default nextConfig;
```

- [ ] **Step 3: Instalar y verificar**

Run: `pnpm install`
Then: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/next.config.ts pnpm-lock.yaml
git commit -m "chore(web): wire @dialog/data into the Next app"
```

---

## Task 3: `lib/firebase.ts` + `.env.local.example`

**Files:**
- Create: `apps/web/.env.local.example`
- Create: `apps/web/lib/firebase.ts`

- [ ] **Step 1: Crear `.env.local.example` con la config real**

Crear `apps/web/.env.local.example`:

```bash
# Config del SDK web de Firebase. NO son secretas (viajan en el bundle del
# cliente), pero las dejamos en .env.local para no hardcodearlas en el código.
# Copiá este archivo a `.env.local` y editá si hace falta.
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDU-IB0_dczoQQ6jxPlXgZC4znkU1Yq3qI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dialog-training-actors.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dialog-training-actors
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dialog-training-actors.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=294762757129
NEXT_PUBLIC_FIREBASE_APP_ID=1:294762757129:web:7e7351fc9fbdc8eebb0cd8

# Si está en `true`, la app se conecta a los emuladores locales en vez del
# proyecto real. Útil mientras Google/Apple no estén habilitados en consola.
# NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

- [ ] **Step 2: Crear `apps/web/lib/firebase.ts`**

```ts
'use client';

import { initFirebase, type FirebaseServices } from '@dialog/data';

let cached: FirebaseServices | undefined;

/**
 * Devuelve los handles de Firebase de la app, inicializándolos la primera
 * vez. Lee la config de `NEXT_PUBLIC_FIREBASE_*` y, si
 * `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, conecta a los emuladores locales.
 */
export function getFirebase(): FirebaseServices {
  if (cached !== undefined) {
    return cached;
  }

  const config = {
    apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  };

  const useEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  cached = initFirebase(
    config,
    useEmulators
      ? {
          emulators: {
            authUrl: 'http://127.0.0.1:9099',
            firestore: { host: '127.0.0.1', port: 8080 },
          },
        }
      : {},
  );
  return cached;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/.env.local.example apps/web/lib/firebase.ts
git commit -m "feat(web): add Firebase init wrapper with env-var config"
```

---

## Task 4: `lib/firebase-errors.ts` + tests

**Files:**
- Create: `apps/web/lib/firebase-errors.ts`
- Test: `apps/web/lib/firebase-errors.test.ts`
- Modify: `apps/web/vitest.config.mts`

- [ ] **Step 1: Ampliar el `include` de vitest**

Editar `apps/web/vitest.config.mts`. La sección `test.include` actualmente es:

```ts
    include: ['app/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
```

Reemplazarla por:

```ts
    include: [
      'app/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'lib/**/*.test.ts',
      'components/**/*.test.tsx',
    ],
```

(Las dos últimas líneas son nuevas; el resto queda igual.)

- [ ] **Step 2: Escribir el test del mapper**

Crear `apps/web/lib/firebase-errors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { firebaseErrorMessage, isPopupCancelled } from './firebase-errors';

describe('firebaseErrorMessage', () => {
  it('traduce auth/email-already-in-use', () => {
    expect(firebaseErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Ya existe una cuenta con ese email.',
    );
  });

  it('traduce auth/invalid-credential', () => {
    expect(firebaseErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Email o contraseña incorrectos.',
    );
  });

  it('traduce auth/wrong-password', () => {
    expect(firebaseErrorMessage({ code: 'auth/wrong-password' })).toBe(
      'Email o contraseña incorrectos.',
    );
  });

  it('traduce auth/weak-password', () => {
    expect(firebaseErrorMessage({ code: 'auth/weak-password' })).toBe(
      'La contraseña es muy corta.',
    );
  });

  it('traduce auth/user-not-found', () => {
    expect(firebaseErrorMessage({ code: 'auth/user-not-found' })).toBe(
      'No encontramos esa cuenta.',
    );
  });

  it('traduce auth/too-many-requests', () => {
    expect(firebaseErrorMessage({ code: 'auth/too-many-requests' })).toBe(
      'Demasiados intentos. Probá más tarde.',
    );
  });

  it('traduce auth/network-request-failed', () => {
    expect(firebaseErrorMessage({ code: 'auth/network-request-failed' })).toBe(
      'Sin conexión. Probá de nuevo.',
    );
  });

  it('usa un fallback genérico para códigos desconocidos', () => {
    expect(firebaseErrorMessage({ code: 'auth/something-weird' })).toBe(
      'Algo salió mal.',
    );
  });

  it('usa el fallback cuando el error no tiene código', () => {
    expect(firebaseErrorMessage(new Error('boom'))).toBe('Algo salió mal.');
  });
});

describe('isPopupCancelled', () => {
  it('detecta auth/popup-closed-by-user', () => {
    expect(isPopupCancelled({ code: 'auth/popup-closed-by-user' })).toBe(true);
  });

  it('detecta auth/cancelled-popup-request', () => {
    expect(isPopupCancelled({ code: 'auth/cancelled-popup-request' })).toBe(
      true,
    );
  });

  it('no detecta otros errores', () => {
    expect(isPopupCancelled({ code: 'auth/wrong-password' })).toBe(false);
    expect(isPopupCancelled(new Error('boom'))).toBe(false);
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./firebase-errors`.

- [ ] **Step 4: Implementar el mapper**

Crear `apps/web/lib/firebase-errors.ts`:

```ts
const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña es muy corta.',
  'auth/user-not-found': 'No encontramos esa cuenta.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
  'auth/network-request-failed': 'Sin conexión. Probá de nuevo.',
  'auth/operation-not-allowed':
    'Este método de inicio de sesión no está habilitado.',
};

const FALLBACK = 'Algo salió mal.';

function readCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Traduce un error del SDK de Firebase a un mensaje en español. Para códigos
 * desconocidos devuelve un mensaje genérico y registra el error en la consola.
 */
export function firebaseErrorMessage(error: unknown): string {
  const code = readCode(error);
  if (code !== undefined && code in MESSAGES) {
    return MESSAGES[code] as string;
  }
  console.error('[firebase] error sin traducción:', error);
  return FALLBACK;
}

/** `true` si el error indica que el usuario cerró el popup de sign-in social. */
export function isPopupCancelled(error: unknown): boolean {
  const code = readCode(error);
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  );
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los tests del mapper pasan; los tests anteriores siguen verdes.

- [ ] **Step 6: Verificar typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib apps/web/vitest.config.mts
git commit -m "feat(web): add firebase error message mapper"
```

---

## Task 5: `<FirebaseProvider>` en `@dialog/data` (peer deps + provider + test)

**Files:**
- Modify: `packages/data/package.json`
- Create: `packages/data/src/react/FirebaseProvider.tsx`
- Test: `packages/data/src/react/FirebaseProvider.test.tsx`
- Modify: `packages/data/src/index.ts`

- [ ] **Step 1: Sumar peerDependencies y devDependencies React**

Editar `packages/data/package.json`. Agregar al manifiesto (al mismo nivel que `dependencies`):

```json
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19"
  }
```

Y agregar a `devDependencies` (para testear los hooks):

```json
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@testing-library/react": "^16.1.0",
    "jsdom": "^25.0.1"
```

Run: `pnpm install`
Expected: instala sin errores.

- [ ] **Step 2: Escribir el test que falla**

Crear `packages/data/src/react/FirebaseProvider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { initFirebase, type FirebaseServices } from '../index';
import { FirebaseProvider, useFirebase } from './FirebaseProvider';

const DEMO_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-dialog-test.firebaseapp.com',
  projectId: 'demo-dialog-test',
  storageBucket: 'demo-dialog-test.appspot.com',
  messagingSenderId: '0',
  appId: 'demo-app-id',
};

function buildServices(): FirebaseServices {
  return initFirebase(DEMO_CONFIG, {
    emulators: {
      authUrl: 'http://127.0.0.1:9099',
      firestore: { host: '127.0.0.1', port: 8080 },
    },
  });
}

describe('FirebaseProvider / useFirebase', () => {
  it('expone los handles cuando está dentro del proveedor', () => {
    const services = buildServices();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FirebaseProvider services={services}>{children}</FirebaseProvider>
    );
    const { result } = renderHook(() => useFirebase(), { wrapper });
    expect(result.current).toBe(services);
  });

  it('lanza un error si se usa fuera del proveedor', () => {
    expect(() => renderHook(() => useFirebase())).toThrow(
      /FirebaseProvider/,
    );
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver `./FirebaseProvider`.

- [ ] **Step 4: Implementar `FirebaseProvider`**

Crear `packages/data/src/react/FirebaseProvider.tsx`:

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FirebaseServices } from '../firebase';

const FirebaseContext = createContext<FirebaseServices | null>(null);

/** Provee los handles de Firebase a la subtree React. */
export function FirebaseProvider({
  services,
  children,
}: {
  services: FirebaseServices;
  children: ReactNode;
}) {
  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Devuelve los handles de Firebase del contexto. Lanza si no se está
 * dentro de un `<FirebaseProvider>`.
 */
export function useFirebase(): FirebaseServices {
  const ctx = useContext(FirebaseContext);
  if (ctx === null) {
    throw new Error('useFirebase debe usarse dentro de <FirebaseProvider>');
  }
  return ctx;
}
```

- [ ] **Step 5: Exportar la API pública**

Agregar al final de `packages/data/src/index.ts`:

```ts
export { FirebaseProvider, useFirebase } from './react/FirebaseProvider';
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los 2 tests del provider pasan; los tests anteriores siguen verdes.

- [ ] **Step 7: Verificar typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add packages/data pnpm-lock.yaml
git commit -m "feat(data): add FirebaseProvider and useFirebase hook"
```

---

## Task 6: `<AuthProvider>` + `useAuth`

**Files:**
- Create: `packages/data/src/react/AuthProvider.tsx`
- Create: `packages/data/src/react/useAuth.ts`
- Test: `packages/data/src/react/AuthProvider.test.tsx`
- Modify: `packages/data/src/index.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `packages/data/src/react/AuthProvider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  initFirebase,
  signUpWithEmail,
  signOutCurrentUser,
  type FirebaseServices,
} from '../index';
import { FirebaseProvider } from './FirebaseProvider';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

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
    emulators: {
      authUrl: 'http://127.0.0.1:9099',
      firestore: { host: '127.0.0.1', port: 8080 },
    },
  });
});

function uniqueEmail(): string {
  return `user-${crypto.randomUUID()}@example.com`;
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider services={services}>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseProvider>
  );
}

describe('AuthProvider / useAuth', () => {
  it('arranca en "loading" y pasa a "signedOut" cuando no hay sesión', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.user).toBeNull();
  });

  it('refleja "signedIn" después de registrar un usuario', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });

    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user?.email).toMatch(/@example\.com$/);
  });

  it('vuelve a "signedOut" al cerrar sesión vía la acción del hook', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));

    await act(async () => {
      await result.current.signOut();
    });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.user).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver `./AuthProvider` o `./useAuth`.

- [ ] **Step 3: Implementar `AuthProvider`**

Crear `packages/data/src/react/AuthProvider.tsx`:

```tsx
'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { useFirebase } from './FirebaseProvider';
import {
  observeAuthState,
  signUpWithEmail as serviceSignUpWithEmail,
  signInWithEmail as serviceSignInWithEmail,
  signOutCurrentUser as serviceSignOut,
  sendPasswordReset as serviceSendPasswordReset,
  signInWithGooglePopup as serviceSignInWithGooglePopup,
  signInWithApplePopup as serviceSignInWithApplePopup,
} from '../auth/authService';
import { ensureUserProfile } from '../user/userRepository';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Observa el estado de Firebase Auth y, en el primer login, crea el perfil
 * en Firestore (`users/{uid}`). Provee el estado y las acciones al árbol via
 * `useAuth`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = observeAuthState(auth, async (firebaseUser) => {
      if (firebaseUser !== null) {
        try {
          await ensureUserProfile(db, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
          });
        } catch (e) {
          // No bloqueamos el login si la escritura del perfil falla;
          // se reintenta en el próximo login.
          console.error('[AuthProvider] ensureUserProfile falló', e);
        }
        setUser(firebaseUser);
        setStatus('signedIn');
      } else {
        setUser(null);
        setStatus('signedOut');
      }
    });
    return unsubscribe;
  }, [auth, db]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      await serviceSignUpWithEmail(auth, email, password);
    },
    [auth],
  );
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      await serviceSignInWithEmail(auth, email, password);
    },
    [auth],
  );
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    await serviceSignInWithGooglePopup(auth);
  }, [auth]);
  const signInWithApple = useCallback(async (): Promise<void> => {
    await serviceSignInWithApplePopup(auth);
  }, [auth]);
  const sendPasswordReset = useCallback(
    (email: string): Promise<void> => serviceSendPasswordReset(auth, email),
    [auth],
  );
  const signOut = useCallback(
    (): Promise<void> => serviceSignOut(auth),
    [auth],
  );

  const value: AuthContextValue = {
    user,
    status,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordReset,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
```

- [ ] **Step 4: Implementar `useAuth`**

Crear `packages/data/src/react/useAuth.ts`:

```ts
'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Devuelve el estado y las acciones de autenticación. Lanza si se usa fuera
 * de un `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
```

- [ ] **Step 5: Exportar la API pública**

Agregar al final de `packages/data/src/index.ts`:

```ts
export { AuthProvider } from './react/AuthProvider';
export type { AuthStatus, AuthContextValue } from './react/AuthProvider';
export { useAuth } from './react/useAuth';
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los 3 tests de `AuthProvider`/`useAuth` pasan; los anteriores siguen verdes.

- [ ] **Step 7: Verificar typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add AuthProvider and useAuth React hook"
```

---

## Task 7: `useScripts`

**Files:**
- Create: `packages/data/src/react/useScripts.ts`
- Test: `packages/data/src/react/useScripts.test.tsx`
- Modify: `packages/data/src/index.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `packages/data/src/react/useScripts.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
} from '@dialog/core';
import {
  initFirebase,
  signUpWithEmail,
  signOutCurrentUser,
  type FirebaseServices,
} from '../index';
import { FirebaseProvider } from './FirebaseProvider';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { useScripts } from './useScripts';

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
    emulators: {
      authUrl: 'http://127.0.0.1:9099',
      firestore: { host: '127.0.0.1', port: 8080 },
    },
  });
});

function uniqueEmail(): string {
  return `user-${crypto.randomUUID()}@example.com`;
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider services={services}>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseProvider>
  );
}

function buildSampleScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Mi guion', ownerUid });
  const [s1, scene] = addScene(empty, 'Acto I');
  const [s2, hamlet] = addCharacter(s1, 'Hamlet');
  const [s3] = addLine(s2, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Hola.',
  });
  return s3;
}

describe('useScripts', () => {
  it('arranca vacío cuando no hay sesión', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(
      () => ({ auth: useAuth(), scripts: useScripts() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.auth.status).toBe('signedOut'));
    expect(result.current.scripts.scripts).toEqual([]);
  });

  it('lista los guiones del usuario y refleja create/remove en vivo', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(
      () => ({ auth: useAuth(), scripts: useScripts() }),
      { wrapper },
    );

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });
    await waitFor(() => expect(result.current.auth.status).toBe('signedIn'));
    await waitFor(() =>
      expect(result.current.scripts.status).toBe('ready'),
    );
    expect(result.current.scripts.scripts).toEqual([]);

    const uid = result.current.auth.user?.uid as string;
    const script = buildSampleScript(uid);

    await act(async () => {
      await result.current.scripts.create(script);
    });
    await waitFor(() =>
      expect(result.current.scripts.scripts).toHaveLength(1),
    );
    const first = result.current.scripts.scripts[0];
    expect(first?.title).toBe('Mi guion');

    await act(async () => {
      await result.current.scripts.remove(script.id);
    });
    await waitFor(() =>
      expect(result.current.scripts.scripts).toHaveLength(0),
    );
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver `./useScripts`.

- [ ] **Step 3: Implementar `useScripts`**

Crear `packages/data/src/react/useScripts.ts`:

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Script } from '@dialog/core';
import { useFirebase } from './FirebaseProvider';
import { useAuth } from './useAuth';
import {
  saveScript,
  deleteScript,
  type ScriptSummary,
} from '../scripts/scriptRepository';

export type ScriptsStatus = 'loading' | 'ready' | 'error';

export interface UseScriptsResult {
  scripts: ScriptSummary[];
  status: ScriptsStatus;
  error: Error | null;
  /** Guarda un guion completo (crear o reemplazar). */
  create: (script: Script) => Promise<void>;
  /** Borra un guion por id. */
  remove: (scriptId: string) => Promise<void>;
}

/**
 * Subscripción en vivo a la lista de guiones del usuario autenticado. Cuando
 * no hay sesión, devuelve una lista vacía con `status: 'ready'`.
 */
export function useScripts(): UseScriptsResult {
  const { db } = useFirebase();
  const { user } = useAuth();
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [status, setStatus] = useState<ScriptsStatus>('loading');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user === null) {
      setScripts([]);
      setStatus('ready');
      setError(null);
      return;
    }
    setStatus('loading');
    const q = query(
      collection(db, 'scripts'),
      where('ownerUid', '==', user.uid),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list: ScriptSummary[] = snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title as string,
          updatedAt: d.data().updatedAt as number,
        }));
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setScripts(list);
        setStatus('ready');
        setError(null);
      },
      (err) => {
        setError(err);
        setStatus('error');
      },
    );
    return unsubscribe;
  }, [db, user]);

  const create = useCallback(
    async (script: Script): Promise<void> => {
      await saveScript(db, script);
    },
    [db],
  );

  const remove = useCallback(
    async (scriptId: string): Promise<void> => {
      await deleteScript(db, scriptId);
    },
    [db],
  );

  return { scripts, status, error, create, remove };
}
```

- [ ] **Step 4: Exportar la API pública**

Agregar al final de `packages/data/src/index.ts`:

```ts
export { useScripts } from './react/useScripts';
export type { ScriptsStatus, UseScriptsResult } from './react/useScripts';
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los 2 tests de `useScripts` pasan; los anteriores siguen verdes.

- [ ] **Step 6: Verificar typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add useScripts hook with live subscription"
```

---

## Task 8: Wire de proveedores y placeholder de la home

**Files:**
- Create: `apps/web/app/providers.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`
- Delete: `apps/web/app/page.test.tsx`

- [ ] **Step 1: Crear el wrapper cliente de proveedores**

Crear `apps/web/app/providers.tsx`:

```tsx
'use client';

import { useState, type ReactNode } from 'react';
import { AuthProvider, FirebaseProvider } from '@dialog/data';
import { Toaster } from '@/components/ui/sonner';
import { getFirebase } from '@/lib/firebase';

export function Providers({ children }: { children: ReactNode }) {
  // useState con inicializador lazy: getFirebase() corre una sola vez por
  // sesión del navegador.
  const [services] = useState(() => getFirebase());
  return (
    <FirebaseProvider services={services}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </FirebaseProvider>
  );
}
```

- [ ] **Step 2: Envolver el árbol con `<Providers>` en `layout.tsx`**

READ `apps/web/app/layout.tsx`. Es el layout que generó Next + shadcn. Hacer dos cambios MÍNIMOS:

1. Agregar el import al tope:
```tsx
import { Providers } from './providers';
```

2. Envolver `{children}` dentro del `<body>` con `<Providers>{children}</Providers>`. No cambiar nada más (la importación de `globals.css`, las fonts, las classes del body — todo se queda igual).

- [ ] **Step 3: Reemplazar el contenido de `page.tsx` con el placeholder por status**

Reemplazar el contenido completo de `apps/web/app/page.tsx` por:

```tsx
'use client';

import { useAuth } from '@dialog/data';

export default function Home() {
  const { status, user, signOut } = useAuth();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (status === 'signedOut') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Iniciá sesión</h1>
          <p className="mt-4 text-muted-foreground">
            La pantalla de login llega en el próximo plan.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Hola, {user?.email}</h1>
      <p className="text-muted-foreground">
        Acá va la lista de tus guiones, próximamente.
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm underline"
      >
        Cerrar sesión
      </button>
    </main>
  );
}
```

- [ ] **Step 4: Eliminar el test del demo viejo**

Eliminar `apps/web/app/page.test.tsx`. (Sus aserciones contra el guion de muestra dejan de aplicar; los tests reales de la home llegan en los planes 2 y 3 cuando existan las pantallas.)

- [ ] **Step 5: Verificar el typecheck y el build de la web**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

Then: `pnpm --filter @dialog/web build`
Expected: `next build` termina con éxito.

(Para que el build inline las env vars, antes podés correr `cp apps/web/.env.local.example apps/web/.env.local`. Si no, el build pasa igual porque la validación de `requireEnv` corre en runtime, no en build time.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/app
git commit -m "feat(web): mount Firebase providers and status-based home placeholder"
```

---

## Task 9: Verificación completa del monorepo

**Files:** (ninguno — solo verificación)

- [ ] **Step 1: Correr la suite completa**

Run: `pnpm install`
Then: `pnpm test`
Expected: PASS — Turborepo corre los 4 paquetes; `@dialog/data` ahora tiene tests adicionales del provider y los hooks (contra emuladores).

Then: `pnpm typecheck`
Expected: `Tasks: 4 successful, 4 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito.

- [ ] **Step 2: Commit (solo si `pnpm install` actualizó el lockfile)**

Si `git status` muestra cambios en `pnpm-lock.yaml`:

```bash
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

Si no hay cambios, omitir este commit.

---

## Verificación final

Al terminar las 9 tareas:

- `apps/web` tiene Tailwind v4 + shadcn/ui instalados y un set inicial de
  componentes (button, input, label, form, card, tabs, sonner).
- `apps/web/lib/firebase.ts` lee la config de env vars y soporta el flag
  `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`.
- `apps/web/lib/firebase-errors.ts` traduce los códigos de Firebase Auth a
  mensajes en español; cubierto por tests.
- `@dialog/data` exporta `FirebaseProvider`, `useFirebase`, `AuthProvider`,
  `useAuth`, `useScripts`, todos cubiertos por tests con jsdom + RTL contra
  los emuladores.
- `apps/web` monta `<FirebaseProvider>`, `<AuthProvider>` y el `<Toaster>` en
  el árbol cliente; la home renderiza un placeholder por status.
- `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes desde la raíz.

Esto deja la fundación lista para los planes siguientes:

- **Plan 2**: pantalla de autenticación (`AuthScreen`, formularios con
  react-hook-form + zod, mapper de errores, botones de Google/Apple).
- **Plan 3**: pantalla "Mis guiones" + viewer read-only.

---

## Self-Review

**Cobertura del spec:** Implementa la sección "Setup + capa React" de la
decomposición (sección 10 del spec, plan 1 de 3). Cubre:
- Setup de Tailwind + shadcn (sección 3 / 4.2).
- `lib/firebase.ts` con env vars y emulator flag (secciones 4.3 / 8).
- `lib/firebase-errors.ts` con códigos en español (sección 7).
- `<FirebaseProvider>`/`<AuthProvider>`/`useAuth`/`useScripts` en `@dialog/data`
  (sección 4.1), con tests jsdom + RTL contra emuladores.
- `<Providers>` cliente + envoltura en `layout.tsx` + placeholder de la home
  por status (sección 4.3).
Las pantallas reales (Auth, Mis guiones, Viewer) quedan explícitamente para
los planes 2 y 3, según declara la verificación final.

**Placeholders:** No hay TODOs ni pasos sin contenido. El "placeholder" de la
home es contenido real (texto explícito + estilos Tailwind), no un comentario
diferido.

**Consistencia de tipos:** `FirebaseConfig`, `FirebaseServices`,
`InitFirebaseOptions` ya existen en `firebase.ts` (fases anteriores) y se
consumen sin cambios. `AuthStatus`, `AuthContextValue`, `ScriptsStatus`,
`UseScriptsResult` se definen una sola vez y se reutilizan con el mismo
nombre en sus tests, sus exports y los consumers (`apps/web/app/page.tsx` usa
`useAuth()` que devuelve `AuthContextValue`). `firebaseErrorMessage` /
`isPopupCancelled` se definen en Task 4 y no se usan en este plan (las
consume el plan 2). Los hooks (`useAuth`, `useFirebase`, `useScripts`)
mantienen las mismas firmas en su implementación, sus tests y `index.ts`.
