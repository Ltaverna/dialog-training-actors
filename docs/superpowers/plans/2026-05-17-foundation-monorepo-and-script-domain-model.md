# Fundación: Monorepo y Modelo de Dominio del Guion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establecer un monorepo pnpm + Turborepo con el paquete `@dialog/core`, que contiene el modelo de dominio canónico del guion (`Script`, `Scene`, `Character`, `Line`) y sus operaciones puras, completamente testeado.

**Architecture:** Monorepo con un núcleo (`packages/core`) escrito en TypeScript puro, sin dependencias de React ni Firebase. Toda la lógica de dominio del guion vive acá como funciones puras e inmutables, lo que la hace 100% testeable con tests unitarios. Las apps y la capa de datos consumirán este paquete en planes posteriores.

**Tech Stack:** pnpm (workspaces), Turborepo, TypeScript 5.7, Vitest 2.

**Contexto del proyecto:** Esta es la Fase 0 del producto descrito en `docs/superpowers/specs/2026-05-17-actor-dialogue-practice-app-design.md`. El repo ya existe como repositorio git con un commit inicial (el spec) y remote `origin` en GitHub. El directorio raíz es `/Users/lucas/Documents/Proyectos/dialog-training-actors`.

**Nota sobre persistencia:** En el dominio, `Script` mantiene `lines` como un array en memoria. La capa de datos (plan posterior) será la responsable de mapear ese array a la subcolección de Firestore descrita en el spec. El modelo de dominio es agnóstico de la persistencia.

---

## File Structure

Archivos que crea este plan:

| Archivo | Responsabilidad |
|---------|-----------------|
| `package.json` (raíz) | Workspace raíz: scripts de Turborepo, devDependencies compartidas |
| `pnpm-workspace.yaml` | Declara los globs de paquetes del workspace |
| `turbo.json` | Pipeline de tareas (`build`, `test`, `typecheck`) |
| `.gitignore` | Ignora artefactos de build y dependencias |
| `.nvmrc` | Fija la versión de Node |
| `tsconfig.base.json` | Config TypeScript compartida por todos los paquetes |
| `packages/core/package.json` | Manifiesto del paquete `@dialog/core` |
| `packages/core/tsconfig.json` | Config TS del paquete, extiende la base |
| `packages/core/vitest.config.ts` | Config del runner de tests |
| `packages/core/src/index.ts` | Punto de entrada público del paquete |
| `packages/core/src/script/types.ts` | Tipos del dominio del guion |
| `packages/core/src/script/createScript.ts` | Factory de `Script` vacío |
| `packages/core/src/script/builders.ts` | Operaciones inmutables: agregar personajes, escenas y líneas |
| `packages/core/src/script/selectors.ts` | Consultas de solo lectura sobre un `Script` |
| `packages/core/src/script/validateScript.ts` | Validación de integridad referencial del guion |
| `packages/core/src/script/*.test.ts` | Tests unitarios de cada módulo |

---

## Task 1: Inicializar el monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Crear el `package.json` raíz**

Crear `package.json`:

```json
{
  "name": "dialog-training-actors",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Crear `pnpm-workspace.yaml`**

Crear `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **Step 3: Crear `turbo.json`**

Crear `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Crear `.gitignore`**

Crear `.gitignore`:

```
node_modules/
dist/
.turbo/
coverage/
*.log
.DS_Store
.env
.env.local
```

- [ ] **Step 5: Crear `.nvmrc`**

Crear `.nvmrc`:

```
20
```

- [ ] **Step 6: Crear `tsconfig.base.json`**

Crear `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 7: Instalar dependencias y verificar**

Run: `pnpm install`
Expected: instala `turbo` y `typescript` sin errores; se crea `pnpm-lock.yaml`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .nvmrc tsconfig.base.json pnpm-lock.yaml
git commit -m "chore: initialize pnpm + turborepo monorepo"
```

---

## Task 2: Scaffold del paquete `@dialog/core`

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/sanity.test.ts`

- [ ] **Step 1: Crear el manifiesto del paquete**

Crear `packages/core/package.json`:

```json
{
  "name": "@dialog/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Crear la config TypeScript del paquete**

Crear `packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Crear la config de Vitest**

Crear `packages/core/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Crear el punto de entrada del paquete**

Crear `packages/core/src/index.ts`:

```ts
// El contenido público del paquete se va exportando en las tareas siguientes.
export {};
```

- [ ] **Step 5: Escribir un test de sanidad**

Crear `packages/core/src/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('ejecuta tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Instalar dependencias y correr el test de sanidad**

Run: `pnpm install`
Then: `pnpm --filter @dialog/core test`
Expected: PASS — 1 test pasa (`vitest setup > ejecuta tests`).

- [ ] **Step 7: Verificar el typecheck del paquete**

Run: `pnpm --filter @dialog/core typecheck`
Expected: termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add packages/core pnpm-lock.yaml
git commit -m "chore: scaffold @dialog/core package with vitest"
```

---

## Task 3: Tipos del dominio del guion y factory `createScript`

**Files:**
- Create: `packages/core/src/script/types.ts`
- Create: `packages/core/src/script/createScript.ts`
- Test: `packages/core/src/script/createScript.test.ts`
- Modify: `packages/core/src/index.ts`
- Delete: `packages/core/src/sanity.test.ts`

- [ ] **Step 1: Definir los tipos del dominio**

Crear `packages/core/src/script/types.ts`:

```ts
export type CharacterId = string;
export type SceneId = string;
export type LineId = string;

/** Un personaje del guion. */
export interface Character {
  id: CharacterId;
  name: string;
}

/** Una escena del guion. `order` define el orden entre escenas (desde 0). */
export interface Scene {
  id: SceneId;
  title: string;
  order: number;
}

/** `dialogue`: línea hablada por un personaje. `direction`: acotación. */
export type LineType = 'dialogue' | 'direction';

/**
 * Una línea del guion. `order` define el orden dentro de su escena (desde 0).
 * `characterId` es null en las acotaciones (`type === 'direction'`).
 */
export interface Line {
  id: LineId;
  sceneId: SceneId;
  order: number;
  characterId: CharacterId | null;
  type: LineType;
  text: string;
}

/** El guion canónico. Todos los métodos de importación convergen a esta forma. */
export interface Script {
  id: string;
  title: string;
  ownerUid: string;
  characters: Character[];
  scenes: Scene[];
  lines: Line[];
}
```

- [ ] **Step 2: Escribir el test que falla para `createScript`**

Crear `packages/core/src/script/createScript.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createScript } from './createScript';

describe('createScript', () => {
  it('crea un guion vacío con el título y el dueño dados', () => {
    const script = createScript({ title: 'Hamlet', ownerUid: 'user-1' });
    expect(script.title).toBe('Hamlet');
    expect(script.ownerUid).toBe('user-1');
    expect(script.characters).toEqual([]);
    expect(script.scenes).toEqual([]);
    expect(script.lines).toEqual([]);
  });

  it('asigna un id único a cada guion', () => {
    const a = createScript({ title: 'A', ownerUid: 'u' });
    const b = createScript({ title: 'B', ownerUid: 'u' });
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/core test`
Expected: FAIL — no se puede resolver el módulo `./createScript`.

- [ ] **Step 4: Implementar `createScript`**

Crear `packages/core/src/script/createScript.ts`:

```ts
import type { Script } from './types';

export interface CreateScriptParams {
  title: string;
  ownerUid: string;
}

/** Crea un guion vacío, sin personajes, escenas ni líneas. */
export function createScript(params: CreateScriptParams): Script {
  return {
    id: crypto.randomUUID(),
    title: params.title,
    ownerUid: params.ownerUid,
    characters: [],
    scenes: [],
    lines: [],
  };
}
```

- [ ] **Step 5: Borrar el test de sanidad y exportar la API pública**

Eliminar `packages/core/src/sanity.test.ts`.

Reemplazar el contenido de `packages/core/src/index.ts` por:

```ts
export type {
  CharacterId,
  SceneId,
  LineId,
  Character,
  Scene,
  LineType,
  Line,
  Script,
} from './script/types';
export { createScript } from './script/createScript';
export type { CreateScriptParams } from './script/createScript';
```

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/core test`
Expected: PASS — los 2 tests de `createScript` pasan.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): add Script domain types and createScript factory"
```

---

## Task 4: Builders de personajes y escenas

**Files:**
- Create: `packages/core/src/script/builders.ts`
- Test: `packages/core/src/script/builders.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Escribir el test que falla para `addCharacter` y `addScene`**

Crear `packages/core/src/script/builders.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createScript } from './createScript';
import { addCharacter, addScene } from './builders';

describe('addCharacter', () => {
  it('agrega un personaje con id único y devuelve el personaje creado', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    const [updated, character] = addCharacter(script, 'Ofelia');

    expect(character.name).toBe('Ofelia');
    expect(character.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(updated.characters).toEqual([character]);
  });

  it('no muta el guion original', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    addCharacter(script, 'Ofelia');
    expect(script.characters).toEqual([]);
  });
});

describe('addScene', () => {
  it('agrega una escena con order incremental desde 0', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    const [afterFirst, first] = addScene(script, 'Acto I');
    const [afterSecond, second] = addScene(afterFirst, 'Acto II');

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(afterSecond.scenes).toEqual([first, second]);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/core test`
Expected: FAIL — no se puede resolver el módulo `./builders`.

- [ ] **Step 3: Implementar `addCharacter` y `addScene`**

Crear `packages/core/src/script/builders.ts`:

```ts
import type { Character, Scene, Script } from './types';

/**
 * Devuelve un nuevo guion con el personaje agregado, junto con el personaje
 * creado. No muta el guion original.
 */
export function addCharacter(
  script: Script,
  name: string,
): [Script, Character] {
  const character: Character = { id: crypto.randomUUID(), name };
  return [
    { ...script, characters: [...script.characters, character] },
    character,
  ];
}

/**
 * Devuelve un nuevo guion con la escena agregada al final (su `order` es la
 * cantidad de escenas previas), junto con la escena creada. No muta el original.
 */
export function addScene(script: Script, title: string): [Script, Scene] {
  const scene: Scene = {
    id: crypto.randomUUID(),
    title,
    order: script.scenes.length,
  };
  return [{ ...script, scenes: [...script.scenes, scene] }, scene];
}
```

- [ ] **Step 4: Exportar la nueva API pública**

Agregar al final de `packages/core/src/index.ts`:

```ts
export { addCharacter, addScene } from './builders';
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/core test`
Expected: PASS — los tests de `addCharacter` y `addScene` pasan.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): add character and scene builders"
```

---

## Task 5: Builder de líneas (`addLine`)

**Files:**
- Modify: `packages/core/src/script/builders.ts`
- Modify: `packages/core/src/script/builders.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Escribir el test que falla para `addLine`**

Agregar al final de `packages/core/src/script/builders.test.ts`:

```ts
import { addLine } from './builders';

describe('addLine', () => {
  it('agrega una línea de diálogo con order incremental dentro de la escena', () => {
    let script = createScript({ title: 'T', ownerUid: 'u' });
    const [s1, scene] = addScene(script, 'Acto I');
    const [s2, character] = addCharacter(s1, 'Hamlet');

    const [s3, first] = addLine(s2, {
      sceneId: scene.id,
      characterId: character.id,
      type: 'dialogue',
      text: 'Ser o no ser.',
    });
    const [s4, second] = addLine(s3, {
      sceneId: scene.id,
      characterId: character.id,
      type: 'dialogue',
      text: 'Esa es la cuestión.',
    });

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(first.text).toBe('Ser o no ser.');
    expect(s4.lines).toEqual([first, second]);
  });

  it('numera el order de cada escena por separado', () => {
    let script = createScript({ title: 'T', ownerUid: 'u' });
    const [s1, sceneA] = addScene(script, 'Acto I');
    const [s2, sceneB] = addScene(s1, 'Acto II');

    const [s3, lineA] = addLine(s2, {
      sceneId: sceneA.id,
      characterId: null,
      type: 'direction',
      text: 'Entra el rey.',
    });
    const [, lineB] = addLine(s3, {
      sceneId: sceneB.id,
      characterId: null,
      type: 'direction',
      text: 'Sale el rey.',
    });

    expect(lineA.order).toBe(0);
    expect(lineB.order).toBe(0);
  });

  it('no muta el guion original', () => {
    const [s1, scene] = addScene(createScript({ title: 'T', ownerUid: 'u' }), 'Acto I');
    addLine(s1, { sceneId: scene.id, characterId: null, type: 'direction', text: 'x' });
    expect(s1.lines).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/core test`
Expected: FAIL — `addLine` no está exportado por `./builders`.

- [ ] **Step 3: Implementar `addLine`**

Agregar al final de `packages/core/src/script/builders.ts`:

```ts
import type { CharacterId, Line, LineType, SceneId } from './types';

export interface AddLineParams {
  sceneId: SceneId;
  characterId: CharacterId | null;
  type: LineType;
  text: string;
}

/**
 * Devuelve un nuevo guion con la línea agregada al final de su escena (su
 * `order` es la cantidad de líneas previas en esa escena), junto con la línea
 * creada. No muta el guion original.
 */
export function addLine(script: Script, params: AddLineParams): [Script, Line] {
  const order = script.lines.filter((l) => l.sceneId === params.sceneId).length;
  const line: Line = {
    id: crypto.randomUUID(),
    sceneId: params.sceneId,
    order,
    characterId: params.characterId,
    type: params.type,
    text: params.text,
  };
  return [{ ...script, lines: [...script.lines, line] }, line];
}
```

Nota: el `import type` de `Character, Scene, Script` ya existe en la cabecera del archivo (Task 4). Agregar esta segunda línea de `import type` para los tipos nuevos es válido en TypeScript.

- [ ] **Step 4: Exportar la nueva API pública**

Agregar al final de `packages/core/src/index.ts`:

```ts
export { addLine } from './builders';
export type { AddLineParams } from './builders';
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/core test`
Expected: PASS — los 3 tests de `addLine` pasan, junto con todos los anteriores.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): add line builder with per-scene ordering"
```

---

## Task 6: Selector `getSceneLines`

**Files:**
- Create: `packages/core/src/script/selectors.ts`
- Test: `packages/core/src/script/selectors.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Escribir el test que falla para `getSceneLines`**

Crear `packages/core/src/script/selectors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Line, Script } from './types';
import { getSceneLines } from './selectors';

function scriptWithLines(lines: Line[]): Script {
  return {
    id: 's',
    title: 'T',
    ownerUid: 'u',
    characters: [],
    scenes: [],
    lines,
  };
}

describe('getSceneLines', () => {
  it('devuelve solo las líneas de la escena pedida, ordenadas por order', () => {
    const script = scriptWithLines([
      { id: 'l3', sceneId: 'A', order: 1, characterId: null, type: 'direction', text: 'b' },
      { id: 'l1', sceneId: 'B', order: 0, characterId: null, type: 'direction', text: 'otra' },
      { id: 'l2', sceneId: 'A', order: 0, characterId: null, type: 'direction', text: 'a' },
    ]);

    const lines = getSceneLines(script, 'A');

    expect(lines.map((l) => l.id)).toEqual(['l2', 'l3']);
  });

  it('devuelve un array vacío si la escena no tiene líneas', () => {
    expect(getSceneLines(scriptWithLines([]), 'A')).toEqual([]);
  });

  it('no muta el array de líneas del guion', () => {
    const script = scriptWithLines([
      { id: 'l2', sceneId: 'A', order: 1, characterId: null, type: 'direction', text: 'b' },
      { id: 'l1', sceneId: 'A', order: 0, characterId: null, type: 'direction', text: 'a' },
    ]);
    getSceneLines(script, 'A');
    expect(script.lines.map((l) => l.id)).toEqual(['l2', 'l1']);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/core test`
Expected: FAIL — no se puede resolver el módulo `./selectors`.

- [ ] **Step 3: Implementar `getSceneLines`**

Crear `packages/core/src/script/selectors.ts`:

```ts
import type { Line, SceneId, Script } from './types';

/**
 * Devuelve las líneas de una escena ordenadas por `order` ascendente.
 * No muta el guion: opera sobre una copia del array de líneas.
 */
export function getSceneLines(script: Script, sceneId: SceneId): Line[] {
  return script.lines
    .filter((line) => line.sceneId === sceneId)
    .sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 4: Exportar la nueva API pública**

Agregar al final de `packages/core/src/index.ts`:

```ts
export { getSceneLines } from './selectors';
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/core test`
Expected: PASS — los 3 tests de `getSceneLines` pasan.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): add getSceneLines selector"
```

---

## Task 7: Validación de integridad del guion (`validateScript`)

**Files:**
- Create: `packages/core/src/script/validateScript.ts`
- Test: `packages/core/src/script/validateScript.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Escribir el test que falla para `validateScript`**

Crear `packages/core/src/script/validateScript.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Script } from './types';
import { validateScript } from './validateScript';

function baseScript(): Script {
  return {
    id: 's',
    title: 'T',
    ownerUid: 'u',
    characters: [{ id: 'c1', name: 'Hamlet' }],
    scenes: [{ id: 'sc1', title: 'Acto I', order: 0 }],
    lines: [],
  };
}

describe('validateScript', () => {
  it('marca como válido un guion correcto', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'Hola.' },
      { id: 'l2', sceneId: 'sc1', order: 1, characterId: null, type: 'direction', text: 'Sale.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reporta una línea de diálogo sin personaje', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: null, type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'Una línea de diálogo debe tener un personaje asignado.' },
    ]);
  });

  it('reporta una línea de diálogo con un personaje inexistente', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'fantasma', type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'La línea referencia un personaje que no existe.' },
    ]);
  });

  it('reporta una acotación que tiene personaje asignado', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'direction', text: 'Sale.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'Una acotación no debe tener un personaje asignado.' },
    ]);
  });

  it('reporta una línea cuya escena no existe', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'inexistente', order: 0, characterId: 'c1', type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'La línea referencia una escena que no existe.' },
    ]);
  });

  it('reporta dos líneas con el mismo order dentro de una escena', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'A.' },
      { id: 'l2', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'B.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l2', message: 'Hay otra línea con el mismo order en la escena.' },
    ]);
  });

  it('acumula varios errores de distintas líneas', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: null, type: 'dialogue', text: 'A.' },
      { id: 'l2', sceneId: 'inexistente', order: 0, characterId: 'c1', type: 'dialogue', text: 'B.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/core test`
Expected: FAIL — no se puede resolver el módulo `./validateScript`.

- [ ] **Step 3: Implementar `validateScript`**

Crear `packages/core/src/script/validateScript.ts`:

```ts
import type { LineId, Script } from './types';

export interface ValidationError {
  lineId: LineId;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Verifica la integridad referencial de un guion. Recorre las líneas en orden
 * y acumula un error por cada problema encontrado:
 * - una línea de diálogo sin personaje, o con un personaje inexistente;
 * - una acotación con personaje asignado;
 * - una línea cuya escena no existe;
 * - dos líneas con el mismo `order` dentro de una misma escena.
 */
export function validateScript(script: Script): ValidationResult {
  const characterIds = new Set(script.characters.map((c) => c.id));
  const sceneIds = new Set(script.scenes.map((s) => s.id));
  const seenOrderBySceneId = new Map<string, Set<number>>();
  const errors: ValidationError[] = [];

  for (const line of script.lines) {
    if (line.type === 'dialogue') {
      if (line.characterId === null) {
        errors.push({
          lineId: line.id,
          message: 'Una línea de diálogo debe tener un personaje asignado.',
        });
      } else if (!characterIds.has(line.characterId)) {
        errors.push({
          lineId: line.id,
          message: 'La línea referencia un personaje que no existe.',
        });
      }
    } else if (line.characterId !== null) {
      errors.push({
        lineId: line.id,
        message: 'Una acotación no debe tener un personaje asignado.',
      });
    }

    if (!sceneIds.has(line.sceneId)) {
      errors.push({
        lineId: line.id,
        message: 'La línea referencia una escena que no existe.',
      });
    }

    let seenOrders = seenOrderBySceneId.get(line.sceneId);
    if (seenOrders === undefined) {
      seenOrders = new Set<number>();
      seenOrderBySceneId.set(line.sceneId, seenOrders);
    }
    if (seenOrders.has(line.order)) {
      errors.push({
        lineId: line.id,
        message: 'Hay otra línea con el mismo order en la escena.',
      });
    } else {
      seenOrders.add(line.order);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Exportar la nueva API pública**

Agregar al final de `packages/core/src/index.ts`:

```ts
export { validateScript } from './validateScript';
export type { ValidationError, ValidationResult } from './validateScript';
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/core test`
Expected: PASS — los 7 tests de `validateScript` pasan, junto con todos los anteriores.

- [ ] **Step 6: Verificar typecheck y la suite completa desde la raíz**

Run: `pnpm typecheck`
Expected: termina sin errores.

Then: `pnpm test`
Expected: PASS — Turborepo corre la suite de `@dialog/core` y todos los tests pasan.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): add script integrity validation"
```

---

## Verificación final

Al terminar las 7 tareas, el repo debe cumplir:

- `pnpm install` instala sin errores.
- `pnpm test` (desde la raíz) corre vía Turborepo y todos los tests de `@dialog/core` pasan.
- `pnpm typecheck` (desde la raíz) termina sin errores.
- `packages/core` expone desde `src/index.ts`: los tipos del dominio, `createScript`, `addCharacter`, `addScene`, `addLine`, `getSceneLines` y `validateScript`.

Esto deja la fundación lista para los planes siguientes: scaffolding de `apps/mobile` (Expo) y `apps/web` (Next.js), el paquete `packages/data` y la integración con Firebase Auth.

---

## Self-Review

**Cobertura del spec:** Este plan implementa la primera mitad de la Fase 0 del spec (sección 9): "Monorepo, `packages/core`". El modelo `Script`/`Scene`/`Character`/`Line` corresponde al `Script` canónico de la sección 5 (componente 1) y 6 (modelo de datos). La integración con Firebase y el scaffolding de apps —el resto de la Fase 0— quedan explícitamente para el plan siguiente, como se indica en la cabecera y en la verificación final. Sin huecos dentro del alcance declarado.

**Placeholders:** No hay TODOs ni pasos sin código. Cada paso de código incluye el contenido completo.

**Consistencia de tipos:** `Script`, `Scene`, `Character`, `Line`, `LineType`, `CharacterId`, `SceneId`, `LineId` se definen en Task 3 y se reutilizan con los mismos nombres y firmas en Tasks 4-7. `AddLineParams` (Task 5), `ValidationError` y `ValidationResult` (Task 7) son consistentes entre su definición y su uso/exportación. Las funciones `createScript`, `addCharacter`, `addScene`, `addLine`, `getSceneLines` y `validateScript` mantienen el mismo nombre y firma en su implementación, sus tests y `index.ts`.
