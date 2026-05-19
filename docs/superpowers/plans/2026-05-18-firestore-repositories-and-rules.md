# Repositorios de Firestore y Reglas de Seguridad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a `@dialog/data` los repositorios de Firestore (`userRepository`, `scriptRepository`), el mapeo entre el `Script` de `@dialog/core` y Firestore, y las reglas de seguridad — todo testeado contra el emulador de Firestore.

**Architecture:** Los repositorios son funciones que reciben un handle `Firestore` y hacen I/O contra Firestore. `userRepository` maneja `users/{uid}`; `scriptRepository` maneja `scripts/{scriptId}` (con `characters` y `scenes` embebidos) y la subcolección `scripts/{scriptId}/lines`. Las reglas de seguridad viven en `firestore.rules`. Los tests usan `@firebase/rules-unit-testing` con las reglas reales cargadas, dentro de `firebase emulators:exec`.

**Tech Stack:** Firebase JS SDK v11, `@firebase/rules-unit-testing` v4, Firebase Emulator Suite (Auth + Firestore), Vitest, TypeScript.

**Contexto del proyecto:** Segundo sub-proyecto del spec `docs/superpowers/specs/2026-05-18-data-layer-and-auth-design.md`. El plan previo entregó `@dialog/data` con `initFirebase()` y el servicio de auth. El monorepo tiene `packages/core` (`@dialog/core`), `packages/data`, `apps/web`, `apps/mobile`. El directorio raíz es `/Users/lucas/Documents/Proyectos/dialog-training-actors`.

**Prerequisitos ya satisfechos:** Java (OpenJDK 25) está instalado y en el PATH — el emulador de Firestore lo necesita y ya funciona. El CLI `firebase` está instalado globalmente.

**Tipos relevantes de `@dialog/core`** (importables desde `@dialog/core`):
`Script = { id, title, ownerUid, characters: Character[], scenes: Scene[], lines: Line[] }`;
`Character = { id, name }`; `Scene = { id, title, order }`;
`Line = { id, sceneId, order, characterId: string | null, type: 'dialogue' | 'direction', text }`.
Builders: `createScript({title, ownerUid})`, `addScene(s, title)→[Script,Scene]`, `addCharacter(s, name)→[Script,Character]`, `addLine(s, {sceneId, characterId, type, text})→[Script,Line]`. Selectores: `getSceneLines(s, sceneId)`, `validateScript(s)→{valid, errors}`.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `firestore.rules` | Reglas de seguridad de Firestore |
| `firestore.indexes.json` | Índices de Firestore (vacío por ahora) |
| `firebase.json` (modif.) | Agrega la sección `firestore` (rules + indexes) |
| `packages/data/package.json` (modif.) | Agrega `@firebase/rules-unit-testing`; el script `test` corre Auth + Firestore |
| `packages/data/src/testing/firestoreTestEnv.ts` | Helper: crea el entorno de test de Firestore con las reglas reales |
| `packages/data/src/testing/firestoreTestEnv.test.ts` | Test del helper |
| `packages/data/src/user/userRepository.ts` | `UserProfile` + `ensureUserProfile` / `getUserProfile` |
| `packages/data/src/user/userRepository.test.ts` | Tests del repositorio de usuario |
| `packages/data/src/scripts/scriptRepository.ts` | CRUD de guiones + mapeo `Script`↔Firestore |
| `packages/data/src/scripts/scriptRepository.test.ts` | Tests del repositorio de guiones |
| `packages/data/src/firestoreRules.test.ts` | Tests de las reglas de seguridad |
| `packages/data/src/index.ts` (modif.) | Exporta los repositorios |

---

## Task 1: Reglas de seguridad de Firestore

**Files:**
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Modify: `firebase.json`

- [ ] **Step 1: Crear `firestore.rules`**

Crear `firestore.rules` en la raíz del repo:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    // Perfil del usuario: solo lo lee y escribe su propio dueño.
    match /users/{uid} {
      allow read, write: if signedIn() && request.auth.uid == uid;
    }

    // Guiones: accesibles por el dueño y por los uids en `collaborators`.
    match /scripts/{scriptId} {
      function canAccess(data) {
        return signedIn() &&
          (data.ownerUid == request.auth.uid ||
           request.auth.uid in data.collaborators);
      }

      allow read: if canAccess(resource.data);
      allow create: if signedIn() &&
        request.resource.data.ownerUid == request.auth.uid;
      allow update: if canAccess(resource.data) &&
        request.resource.data.ownerUid == resource.data.ownerUid;
      allow delete: if signedIn() &&
        resource.data.ownerUid == request.auth.uid;

      // Líneas del guion: mismo permiso que el guion padre.
      match /lines/{lineId} {
        function parentScript() {
          return get(
            /databases/$(database)/documents/scripts/$(scriptId)
          ).data;
        }
        allow read, write: if signedIn() &&
          (parentScript().ownerUid == request.auth.uid ||
           request.auth.uid in parentScript().collaborators);
      }
    }
  }
}
```

- [ ] **Step 2: Crear `firestore.indexes.json`**

Crear `firestore.indexes.json` en la raíz del repo:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Agregar la sección `firestore` a `firebase.json`**

`firebase.json` actualmente solo tiene `emulators`. Reemplazar su contenido completo por (agrega la sección `firestore`, mantiene `emulators` igual):

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
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

- [ ] **Step 4: Verificar que las reglas compilan**

Run: `firebase emulators:exec --only firestore --project demo-dialog-test "echo rules-ok"`
Expected: el emulador de Firestore arranca cargando `firestore.rules` sin errores de sintaxis, imprime `rules-ok` y se apaga. (Un error de sintaxis en las reglas haría fallar el arranque.)

- [ ] **Step 5: Commit**

```bash
git add firestore.rules firestore.indexes.json firebase.json
git commit -m "chore: add firestore security rules and indexes config"
```

---

## Task 2: Harness de tests contra el emulador de Firestore

**Files:**
- Modify: `packages/data/package.json`
- Create: `packages/data/src/testing/firestoreTestEnv.ts`
- Test: `packages/data/src/testing/firestoreTestEnv.test.ts`

- [ ] **Step 1: Agregar la dependencia y actualizar el script `test`**

Editar `packages/data/package.json`. Agregar a `devDependencies`:

```json
    "@firebase/rules-unit-testing": "^4.0.1"
```

Y cambiar los scripts `test` y `test:watch` para que el emulador levante también Firestore (antes era `--only auth`):

```json
    "test": "firebase emulators:exec --only auth,firestore --project demo-dialog-test 'vitest run'",
    "test:watch": "firebase emulators:exec --only auth,firestore --project demo-dialog-test 'vitest'",
```

Run: `pnpm install`
Expected: instala `@firebase/rules-unit-testing` sin errores.

- [ ] **Step 2: Crear el helper del entorno de test**

Crear `packages/data/src/testing/firestoreTestEnv.ts`:

```ts
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
```

- [ ] **Step 3: Escribir el test que falla del helper**

Crear `packages/data/src/testing/firestoreTestEnv.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { createFirestoreTestEnv } from './firestoreTestEnv';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

describe('createFirestoreTestEnv', () => {
  it('permite leer y escribir Firestore con las reglas deshabilitadas', async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'pruebas', 'd1'), { ok: true });
      const snap = await getDoc(doc(db, 'pruebas', 'd1'));
      expect(snap.exists()).toBe(true);
      expect(snap.data()).toEqual({ ok: true });
    });
  });
});
```

- [ ] **Step 4: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver el módulo `./firestoreTestEnv`.

(El helper se crea en el Step 2; si el orden de ejecución hace que el módulo ya exista, el fallo esperado es en cambio el del Step 5 antes de tener el helper correcto. Lo importante: confirmar el ciclo rojo→verde corriendo el test.)

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — el test del helper pasa, y los 7 tests de `authService` siguen pasando (el emulador ahora levanta Auth + Firestore).

- [ ] **Step 6: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add packages/data pnpm-lock.yaml
git commit -m "test(data): add firestore emulator test harness"
```

---

## Task 3: Repositorio de usuario (`userRepository`)

**Files:**
- Create: `packages/data/src/user/userRepository.ts`
- Test: `packages/data/src/user/userRepository.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `packages/data/src/user/userRepository.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { createFirestoreTestEnv } from '../testing/firestoreTestEnv';
import { ensureUserProfile, getUserProfile } from './userRepository';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

describe('ensureUserProfile', () => {
  it('crea el perfil cuando no existe', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    const profile = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    expect(profile.uid).toBe('user-1');
    expect(profile.displayName).toBe('Ofelia');
    expect(profile.email).toBe('ofelia@example.com');
    expect(profile.subscription).toEqual({ tier: 'free' });
    expect(typeof profile.createdAt).toBe('number');
  });

  it('no sobrescribe un perfil ya existente', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    const first = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    const second = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Otro Nombre',
      email: 'otro@example.com',
    });
    expect(second).toEqual(first);
  });
});

describe('getUserProfile', () => {
  it('devuelve null para un uid inexistente', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    expect(await getUserProfile(db, 'user-1')).toBeNull();
  });

  it('devuelve el perfil después de crearlo', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    const profile = await getUserProfile(db, 'user-1');
    expect(profile?.email).toBe('ofelia@example.com');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver el módulo `./userRepository`.

- [ ] **Step 3: Implementar `userRepository`**

Crear `packages/data/src/user/userRepository.ts`:

```ts
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

/** Estado de suscripción del usuario (placeholder hasta la fase de monetización). */
export interface SubscriptionInfo {
  tier: 'free';
}

/** Perfil del usuario almacenado en `users/{uid}`. */
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  /** Fecha de creación en milisegundos epoch. */
  createdAt: number;
  subscription: SubscriptionInfo;
}

/** Datos mínimos del usuario autenticado necesarios para crear su perfil. */
export interface EnsureUserProfileParams {
  uid: string;
  displayName: string | null;
  email: string | null;
}

/**
 * Devuelve el perfil del usuario, creándolo en `users/{uid}` si todavía no
 * existe (primer inicio de sesión). Si ya existe, lo devuelve sin modificarlo.
 */
export async function ensureUserProfile(
  db: Firestore,
  params: EnsureUserProfileParams,
): Promise<UserProfile> {
  const ref = doc(db, 'users', params.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }
  const profile: UserProfile = {
    uid: params.uid,
    displayName: params.displayName,
    email: params.email,
    createdAt: Date.now(),
    subscription: { tier: 'free' },
  };
  await setDoc(ref, profile);
  return profile;
}

/** Lee el perfil del usuario. Devuelve `null` si no existe. */
export async function getUserProfile(
  db: Firestore,
  uid: string,
): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los 4 tests de `userRepository` pasan contra el emulador de Firestore.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add user profile repository"
```

---

## Task 4: Repositorio de guiones (`scriptRepository`)

**Files:**
- Create: `packages/data/src/scripts/scriptRepository.ts`
- Test: `packages/data/src/scripts/scriptRepository.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `packages/data/src/scripts/scriptRepository.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  validateScript,
  type Script,
} from '@dialog/core';
import { createFirestoreTestEnv } from '../testing/firestoreTestEnv';
import {
  saveScript,
  getScript,
  listScripts,
  deleteScript,
} from './scriptRepository';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

/** Arma un guion de muestra con 1 escena, 2 personajes y 2 líneas. */
function buildSampleScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Escena de práctica', ownerUid });
  const [s1, scene] = addScene(empty, 'Acto I');
  const [s2, hamlet] = addCharacter(s1, 'Hamlet');
  const [s3, ofelia] = addCharacter(s2, 'Ofelia');
  const [s4] = addLine(s3, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Ser o no ser.',
  });
  const [s5] = addLine(s4, {
    sceneId: scene.id,
    characterId: ofelia.id,
    type: 'dialogue',
    text: '¿Cómo os encontráis?',
  });
  return s5;
}

const byId = (a: { id: string }, b: { id: string }): number =>
  a.id.localeCompare(b.id);

describe('saveScript / getScript', () => {
  it('guarda un guion y lo recupera completo', async () => {
    const db = env.authenticatedContext('owner-1').firestore();
    const script = buildSampleScript('owner-1');

    await saveScript(db, script);
    const loaded = await getScript(db, script.id);

    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(script.id);
    expect(loaded?.title).toBe(script.title);
    expect(loaded?.ownerUid).toBe('owner-1');
    expect(loaded?.characters).toEqual(script.characters);
    expect(loaded?.scenes).toEqual(script.scenes);
    expect([...(loaded?.lines ?? [])].sort(byId)).toEqual(
      [...script.lines].sort(byId),
    );
    expect(validateScript(loaded as Script).valid).toBe(true);
  });

  it('devuelve null para un guion inexistente', async () => {
    const db = env.authenticatedContext('owner-1').firestore();
    expect(await getScript(db, 'no-existe')).toBeNull();
  });

  it('reemplaza las líneas al volver a guardar el mismo guion', async () => {
    const db = env.authenticatedContext('owner-1').firestore();
    const script = buildSampleScript('owner-1');
    await saveScript(db, script);

    // Guardar de nuevo el mismo guion pero con una sola línea.
    const trimmed: Script = { ...script, lines: [script.lines[0] as Script['lines'][number]] };
    await saveScript(db, trimmed);

    const loaded = await getScript(db, script.id);
    expect(loaded?.lines).toHaveLength(1);
  });
});

describe('listScripts', () => {
  it('devuelve los guiones del dueño, sin los de otros usuarios', async () => {
    const dbOwner = env.authenticatedContext('owner-1').firestore();
    await saveScript(dbOwner, buildSampleScript('owner-1'));
    await saveScript(dbOwner, buildSampleScript('owner-1'));

    const dbOther = env.authenticatedContext('owner-2').firestore();
    await saveScript(dbOther, buildSampleScript('owner-2'));

    const summaries = await listScripts(dbOwner, 'owner-1');
    expect(summaries).toHaveLength(2);
    for (const s of summaries) {
      expect(s.title).toBe('Escena de práctica');
      expect(typeof s.updatedAt).toBe('number');
    }
  });
});

describe('deleteScript', () => {
  it('borra el guion', async () => {
    const db = env.authenticatedContext('owner-1').firestore();
    const script = buildSampleScript('owner-1');
    await saveScript(db, script);

    await deleteScript(db, script.id);

    expect(await getScript(db, script.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/data test`
Expected: FAIL — no se puede resolver el módulo `./scriptRepository`.

- [ ] **Step 3: Implementar `scriptRepository`**

Crear `packages/data/src/scripts/scriptRepository.ts`:

```ts
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Character, Line, Scene, Script } from '@dialog/core';

/** Resumen de un guion para listados (sin las líneas). */
export interface ScriptSummary {
  id: string;
  title: string;
  /** Última modificación en milisegundos epoch. */
  updatedAt: number;
}

/**
 * Guarda un guion en Firestore: el documento `scripts/{id}` (con `characters`
 * y `scenes` embebidos) y cada línea en la subcolección `lines`. Reemplaza por
 * completo las líneas previas. `createdAt` se preserva si el guion ya existía.
 * No es atómico: escribe el documento y luego las líneas en un batch aparte
 * (necesario para que las reglas de las líneas vean el documento padre).
 *
 * Nota: usa un único batch para las líneas (máximo 500 operaciones). Guiones
 * con más de ~490 líneas requerirán dividir el batch — mejora futura.
 */
export async function saveScript(db: Firestore, script: Script): Promise<void> {
  const scriptRef = doc(db, 'scripts', script.id);
  const existing = await getDoc(scriptRef);
  const now = Date.now();
  const createdAt = existing.exists()
    ? (existing.data().createdAt as number)
    : now;

  await setDoc(scriptRef, {
    title: script.title,
    ownerUid: script.ownerUid,
    collaborators: [],
    characters: script.characters,
    scenes: script.scenes,
    createdAt,
    updatedAt: now,
  });

  const linesCol = collection(scriptRef, 'lines');
  const existingLines = await getDocs(linesCol);
  const batch = writeBatch(db);
  for (const lineDoc of existingLines.docs) {
    batch.delete(lineDoc.ref);
  }
  for (const line of script.lines) {
    batch.set(doc(linesCol, line.id), line);
  }
  await batch.commit();
}

/**
 * Lee un guion completo (documento + subcolección de líneas) y lo reconstruye
 * como `Script` de `@dialog/core`. Devuelve `null` si no existe.
 */
export async function getScript(
  db: Firestore,
  scriptId: string,
): Promise<Script | null> {
  const scriptRef = doc(db, 'scripts', scriptId);
  const snap = await getDoc(scriptRef);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data();
  const linesSnap = await getDocs(collection(scriptRef, 'lines'));
  return {
    id: scriptId,
    title: data.title as string,
    ownerUid: data.ownerUid as string,
    characters: data.characters as Character[],
    scenes: data.scenes as Scene[],
    lines: linesSnap.docs.map((d) => d.data() as Line),
  };
}

/**
 * Lista los guiones de un usuario como resúmenes, ordenados por `updatedAt`
 * descendente (el más reciente primero).
 */
export async function listScripts(
  db: Firestore,
  ownerUid: string,
): Promise<ScriptSummary[]> {
  const q = query(
    collection(db, 'scripts'),
    where('ownerUid', '==', ownerUid),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: d.data().title as string,
      updatedAt: d.data().updatedAt as number,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Borra un guion y todas sus líneas. */
export async function deleteScript(
  db: Firestore,
  scriptId: string,
): Promise<void> {
  const scriptRef = doc(db, 'scripts', scriptId);
  const linesSnap = await getDocs(collection(scriptRef, 'lines'));
  const batch = writeBatch(db);
  for (const lineDoc of linesSnap.docs) {
    batch.delete(lineDoc.ref);
  }
  batch.delete(scriptRef);
  await batch.commit();
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los tests de `scriptRepository` pasan contra el emulador.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): add script repository with Firestore mapping"
```

---

## Task 5: Tests de las reglas de seguridad

**Files:**
- Test: `packages/data/src/firestoreRules.test.ts`

- [ ] **Step 1: Escribir el test de las reglas**

Crear `packages/data/src/firestoreRules.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { createFirestoreTestEnv } from './testing/firestoreTestEnv';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

describe('reglas de users/{uid}', () => {
  it('el dueño puede leer y escribir su propio perfil', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'user-1'), { uid: 'user-1' }));
    await assertSucceeds(getDoc(doc(db, 'users', 'user-1')));
  });

  it('un usuario no puede escribir el perfil de otro', async () => {
    const db = env.authenticatedContext('user-1').firestore();
    await assertFails(setDoc(doc(db, 'users', 'user-2'), { uid: 'user-2' }));
  });

  it('un usuario no puede leer el perfil de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'user-2'), { uid: 'user-2' });
    });
    const db = env.authenticatedContext('user-1').firestore();
    await assertFails(getDoc(doc(db, 'users', 'user-2')));
  });

  it('un request sin autenticar es rechazado', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users', 'user-1')));
  });
});

describe('reglas de scripts/{scriptId}', () => {
  it('el dueño puede crear un guion con su propio ownerUid', async () => {
    const db = env.authenticatedContext('owner-1').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'scripts', 's1'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      }),
    );
  });

  it('un usuario no puede crear un guion con el ownerUid de otro', async () => {
    const db = env.authenticatedContext('intruso').firestore();
    await assertFails(
      setDoc(doc(db, 'scripts', 's2'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      }),
    );
  });

  it('un usuario no puede leer el guion de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's3'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = env.authenticatedContext('intruso').firestore();
    await assertFails(getDoc(doc(db, 'scripts', 's3')));
  });

  it('el dueño puede leer su propio guion', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's4'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = env.authenticatedContext('owner-1').firestore();
    await assertSucceeds(getDoc(doc(db, 'scripts', 's4')));
  });
});

describe('reglas de scripts/{scriptId}/lines/{lineId}', () => {
  it('el dueño del guion puede escribir y leer sus líneas', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's5'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = env.authenticatedContext('owner-1').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'scripts', 's5', 'lines', 'l1'), { text: 'hola' }),
    );
    await assertSucceeds(getDoc(doc(db, 'scripts', 's5', 'lines', 'l1')));
  });

  it('un usuario no puede escribir líneas en el guion de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's6'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = env.authenticatedContext('intruso').firestore();
    await assertFails(
      setDoc(doc(db, 'scripts', 's6', 'lines', 'l1'), { text: 'hola' }),
    );
  });
});
```

- [ ] **Step 2: Correr los tests de reglas**

Run: `pnpm --filter @dialog/data test`
Expected: PASS — los tests de `firestoreRules.test.ts` pasan, junto con todos los anteriores.

Si algún test falla, revisar `firestore.rules` (Task 1) — el comportamiento real de las reglas es la fuente de verdad y este test lo verifica.

- [ ] **Step 3: Verificar el typecheck**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 4: Commit**

```bash
git add packages/data/src
git commit -m "test(data): add firestore security rules tests"
```

---

## Task 6: API pública y verificación del monorepo

**Files:**
- Modify: `packages/data/src/index.ts`

- [ ] **Step 1: Exportar los repositorios**

Agregar al final de `packages/data/src/index.ts`:

```ts
export { ensureUserProfile, getUserProfile } from './user/userRepository';
export type {
  UserProfile,
  SubscriptionInfo,
  EnsureUserProfileParams,
} from './user/userRepository';

export {
  saveScript,
  getScript,
  listScripts,
  deleteScript,
} from './scripts/scriptRepository';
export type { ScriptSummary } from './scripts/scriptRepository';
```

- [ ] **Step 2: Verificar el typecheck del paquete**

Run: `pnpm --filter @dialog/data typecheck`
Expected: termina sin errores.

- [ ] **Step 3: Verificar la suite completa del monorepo**

Run: `pnpm install`
Then: `pnpm test`
Expected: PASS — Turborepo corre los tests de los 4 paquetes; `@dialog/data` levanta los emuladores de Auth y Firestore y todos sus tests pasan.

Then: `pnpm typecheck`
Expected: `Tasks: 4 successful, 4 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito.

- [ ] **Step 4: Commit**

```bash
git add packages/data/src
git commit -m "feat(data): export user and script repositories"
```

---

## Verificación final

Al terminar las 6 tareas:

- `firestore.rules` define la seguridad; `firebase.json` la referencia.
- `@dialog/data` exporta `ensureUserProfile`, `getUserProfile`, `saveScript`,
  `getScript`, `listScripts`, `deleteScript` y sus tipos.
- Los tests corren contra los emuladores de Auth y Firestore y pasan.
- `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes desde la raíz.

Esto completa la capa de datos. Los planes siguientes son la UI de
autenticación en web y en móvil, que consumirán estos repositorios.

---

## Self-Review

**Cobertura del spec:** Implementa la sección "Reglas de seguridad" y la
sección 6 (modelo de datos y mapeo `Script`↔Firestore) del spec
`2026-05-18-data-layer-and-auth-design.md`, más el sub-proyecto 1 (segunda
parte) de la sección 12. `userRepository` cubre `users/{uid}`;
`scriptRepository` cubre `scripts/{scriptId}` + subcolección `lines` con el
mapeo en ambos sentidos. Las reglas y sus tests cubren el aislamiento por
usuario. El contexto/hooks de React (`AuthProvider`, `useScripts`) y la
persistencia offline van con los planes de UI, como indica la verificación
final. Sin huecos dentro del alcance declarado.

**Placeholders:** No hay TODOs ni pasos sin contenido. La nota sobre el límite
de 500 operaciones por batch en `saveScript` es una limitación documentada y
consciente (YAGNI: los guiones de las fases cercanas son chicos), no un
placeholder.

**Consistencia de tipos:** `UserProfile`, `SubscriptionInfo`,
`EnsureUserProfileParams`, `ScriptSummary` se definen en sus repositorios y se
reexportan en `index.ts` con los mismos nombres. `ensureUserProfile`,
`getUserProfile`, `saveScript`, `getScript`, `listScripts`, `deleteScript`
mantienen la misma firma en su implementación, sus tests y `index.ts`; todas
toman `db: Firestore` como primer parámetro. `createFirestoreTestEnv` se define
en `firestoreTestEnv.ts` y se usa con el mismo nombre en los 3 archivos de test
(`userRepository.test.ts`, `scriptRepository.test.ts`, `firestoreRules.test.ts`).
Los tipos `Script`/`Character`/`Scene`/`Line` y los builders se usan con las
firmas reales de `@dialog/core` verificadas contra el plan de la Fase 0.
