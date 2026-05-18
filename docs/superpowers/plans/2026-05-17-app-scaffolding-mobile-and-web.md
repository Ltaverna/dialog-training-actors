# Scaffolding de las Apps Móvil y Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar al monorepo las apps `apps/mobile` (React Native + Expo) y `apps/web` (Next.js), cada una compilando, con typecheck y tests verdes, y mostrando una primera pantalla que consume el paquete `@dialog/core`.

**Architecture:** Cada app es un paquete del workspace pnpm que depende de `@dialog/core` por `workspace:*`. `@dialog/core` se consume como código fuente TypeScript (sin paso de build de librería): Next.js lo transpila vía `transpilePackages`, y Metro (Expo) vía `watchFolders` apuntando a la raíz del monorepo. Antes de scaffoldear las apps se reconcilia `turbo.json`.

**Tech Stack:** Next.js 15 (App Router), Expo SDK 52 (template blank-typescript), React, TypeScript, Vitest + Testing Library (web), jest-expo + Testing Library React Native (mobile), Turborepo, pnpm.

**Contexto del proyecto:** Continúa el producto descrito en `docs/superpowers/specs/2026-05-17-actor-dialogue-practice-app-design.md`. La Fase 0 anterior (plan `2026-05-17-foundation-monorepo-and-script-domain-model.md`) ya entregó el monorepo y `@dialog/core` en `main`. El directorio raíz es `/Users/lucas/Documents/Proyectos/dialog-training-actors`. `@dialog/core` exporta: tipos del dominio, `createScript`, `addCharacter`, `addScene`, `addLine`, `getSceneLines`, `validateScript`, todos desde `@dialog/core`.

**Nota sobre generadores:** Las Tasks 2 y 4 usan generadores oficiales (`create-next-app`, `create-expo-app`). Producen muchos archivos cuyo contenido exacto depende de la versión. El plan fija el comando del generador y luego especifica con contenido exacto solo los archivos que se crean o modifican a mano. Si un comando del generador pide confirmación interactiva, usar los flags indicados para evitarlo.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `turbo.json` (modif.) | Pipeline reconciliado: `build` con `outputs`; `test`/`typecheck` sin `^build` |
| `apps/web/` | App Next.js (`@dialog/web`) — generada |
| `apps/web/package.json` (modif.) | Nombre `@dialog/web`, dep `@dialog/core`, scripts |
| `apps/web/next.config.ts` (modif.) | `transpilePackages: ['@dialog/core']` |
| `apps/web/vitest.config.ts` | Config de Vitest para la app web |
| `apps/web/src/demo/demoScript.ts` | Helper temporal: arma un guion de muestra con `@dialog/core` |
| `apps/web/src/demo/demoScript.test.ts` | Test del helper |
| `apps/web/app/page.tsx` (modif.) | Primera pantalla: renderiza el guion de muestra |
| `apps/web/app/page.test.tsx` | Smoke test de la pantalla |
| `apps/mobile/` | App Expo (`@dialog/mobile`) — generada |
| `apps/mobile/package.json` (modif.) | Nombre `@dialog/mobile`, dep `@dialog/core`, scripts |
| `apps/mobile/metro.config.js` | Config de Metro para el monorepo |
| `apps/mobile/src/demo/demoScript.ts` | Helper temporal: arma un guion de muestra |
| `apps/mobile/src/demo/demoScript.test.ts` | Test del helper |
| `apps/mobile/App.tsx` (modif.) | Primera pantalla: renderiza el guion de muestra |
| `apps/mobile/App.test.tsx` | Smoke test de la pantalla |
| `apps/mobile/jest.config.js` | Config de jest-expo |
| `README.md` | Cómo correr cada app y los comandos del monorepo |

---

## Task 1: Reconciliar `turbo.json`

El review final de la Fase 0 detectó que `turbo.json` declara `test` y `typecheck` con `dependsOn: ["^build"]`, pero `@dialog/core` se consume como fuente y no tiene paso de build. Esa dependencia es innecesaria y confusa. Se quita de `test`/`typecheck`; `build` se mantiene para las apps (que sí buildean).

**Files:**
- Modify: `turbo.json`

- [ ] **Step 1: Reescribir `turbo.json`**

Reemplazar el contenido completo de `turbo.json` por:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "test": {},
    "typecheck": {}
  }
}
```

- [ ] **Step 2: Verificar que la suite del monorepo sigue verde**

Run: `pnpm install`
Then: `pnpm test`
Expected: PASS — Turborepo corre `@dialog/core:test`, 22 tests pasan.

Then: `pnpm typecheck`
Expected: `Tasks: 1 successful, 1 total`.

- [ ] **Step 3: Commit**

```bash
git add turbo.json
git commit -m "chore: reconcile turbo pipeline for source-consumed packages"
```

---

## Task 2: Scaffold de `apps/web` (Next.js)

**Files:**
- Create: `apps/web/` (generada por `create-next-app`)
- Modify: `apps/web/package.json`
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: Generar la app Next.js**

Desde la raíz del repo, ejecutar:

```bash
pnpm create next-app@15 apps/web --typescript --app --no-tailwind --no-src-dir --eslint --import-alias "@/*" --use-pnpm --turbopack
```

Esto crea `apps/web/` con el App Router, TypeScript y ESLint. Si el comando pregunta algo de forma interactiva, aceptar los defaults coherentes con esos flags.

- [ ] **Step 2: Renombrar el paquete y agregar la dependencia a `@dialog/core`**

Abrir `apps/web/package.json`. Cambiar el campo `"name"` a `"@dialog/web"`. Asegurar que exista `"private": true`. Agregar `@dialog/core` como dependencia workspace. El bloque `dependencies` debe incluir (además de lo que generó Next):

```json
    "@dialog/core": "workspace:*"
```

El bloque `scripts` debe quedar exactamente así (reemplazar el que generó Next; `next dev`/`build`/`start`/`lint` pueden venir con o sin `--turbopack` — usar estas líneas):

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
```

- [ ] **Step 3: Configurar `transpilePackages`**

`create-next-app@15` genera `next.config.ts`. Reemplazar su contenido completo por:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@dialog/core` se distribuye como fuente TypeScript dentro del monorepo;
  // Next debe transpilarlo en lugar de tratarlo como dependencia precompilada.
  transpilePackages: ['@dialog/core'],
};

export default nextConfig;
```

- [ ] **Step 4: Instalar y verificar el build**

Run: `pnpm install`
Then: `pnpm --filter @dialog/web build`
Expected: `next build` termina con éxito (`Compiled successfully`), sin errores de tipos.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js app consuming @dialog/core"
```

---

## Task 3: Pantalla inicial y harness de tests de `apps/web`

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/demo/demoScript.ts`
- Test: `apps/web/src/demo/demoScript.test.ts`
- Modify: `apps/web/package.json`
- Modify: `apps/web/app/page.tsx`
- Test: `apps/web/app/page.test.tsx`

- [ ] **Step 1: Agregar las dependencias de testing**

Editar `apps/web/package.json` y agregar al bloque `devDependencies`:

```json
    "vitest": "^2.1.8",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3"
```

Agregar al bloque `scripts` la línea de test (junto a las existentes):

```json
    "test": "vitest run"
```

Run: `pnpm install`
Expected: instala las dependencias sin errores.

- [ ] **Step 2: Crear la config de Vitest**

Crear `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['@testing-library/jest-dom/vitest'],
    include: ['app/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

- [ ] **Step 3: Escribir el test que falla para `buildDemoScript`**

Crear `apps/web/src/demo/demoScript.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateScript, getSceneLines } from '@dialog/core';
import { buildDemoScript } from './demoScript';

describe('buildDemoScript', () => {
  it('arma un guion válido con una escena y al menos dos líneas', () => {
    const { script, scene } = buildDemoScript();

    expect(validateScript(script).valid).toBe(true);
    expect(script.scenes).toHaveLength(1);
    expect(getSceneLines(script, scene.id).length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 4: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver el módulo `./demoScript`.

- [ ] **Step 5: Implementar `buildDemoScript`**

Crear `apps/web/src/demo/demoScript.ts`:

```ts
// Contenido de demostración temporal. Se reemplaza al construir las pantallas
// reales (importación de guiones, ensayo). Sirve para verificar el cableado
// con `@dialog/core` de punta a punta.
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
  type Scene,
} from '@dialog/core';

export interface DemoScript {
  script: Script;
  scene: Scene;
}

/** Arma un guion de muestra con una escena, dos personajes y dos líneas. */
export function buildDemoScript(): DemoScript {
  const empty = createScript({
    title: 'Escena de práctica',
    ownerUid: 'demo',
  });
  const [withScene, scene] = addScene(empty, 'Acto I');
  const [withHamlet, hamlet] = addCharacter(withScene, 'Hamlet');
  const [withOfelia, ofelia] = addCharacter(withHamlet, 'Ofelia');
  const [withLine1] = addLine(withOfelia, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Ser o no ser, esa es la cuestión.',
  });
  const [withLine2] = addLine(withLine1, {
    sceneId: scene.id,
    characterId: ofelia.id,
    type: 'dialogue',
    text: 'Mi señor, ¿cómo os encontráis?',
  });
  return { script: withLine2, scene };
}
```

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — el test de `buildDemoScript` pasa.

- [ ] **Step 7: Escribir el smoke test de la pantalla**

Crear `apps/web/app/page.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('muestra el título del guion de muestra y sus líneas', () => {
    render(<Home />);

    expect(screen.getByText('Escena de práctica')).toBeInTheDocument();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Correr el smoke test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — la pantalla `Home` actual (la generada por Next) no contiene esos textos.

- [ ] **Step 9: Implementar la pantalla inicial**

Reemplazar el contenido completo de `apps/web/app/page.tsx` por:

```tsx
import { getSceneLines } from '@dialog/core';
import { buildDemoScript } from '@/src/demo/demoScript';

export default function Home() {
  const { script, scene } = buildDemoScript();
  const lines = getSceneLines(script, scene.id);
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 640 }}>
      <h1>{script.title}</h1>
      <h2>{scene.title}</h2>
      <ol>
        {lines.map((line) => (
          <li key={line.id}>
            <strong>{characterName(line.characterId)}: </strong>
            {line.text}
          </li>
        ))}
      </ol>
    </main>
  );
}
```

- [ ] **Step 10: Correr los tests y el typecheck**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — el test del helper y el smoke test de la pantalla pasan.

Then: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 11: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): render demo script on the home screen with tests"
```

---

## Task 4: Scaffold de `apps/mobile` (Expo)

**Files:**
- Create: `apps/mobile/` (generada por `create-expo-app`)
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/metro.config.js`

- [ ] **Step 1: Generar la app Expo**

Desde la raíz del repo, ejecutar:

```bash
pnpm create expo-app@latest apps/mobile --template blank-typescript
```

Esto crea `apps/mobile/` con el template TypeScript en blanco (un único `App.tsx`, sin Expo Router).

- [ ] **Step 2: Renombrar el paquete, agregar `@dialog/core` y los scripts**

Abrir `apps/mobile/package.json`. Cambiar `"name"` a `"@dialog/mobile"`. Agregar `"private": true` si no está. Agregar a `dependencies`:

```json
    "@dialog/core": "workspace:*"
```

Reemplazar el bloque `scripts` completo por:

```json
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit"
  }
```

- [ ] **Step 3: Configurar Metro para el monorepo**

Crear `apps/mobile/metro.config.js`:

```js
// Config de Metro para un monorepo pnpm: Metro debe vigilar la raíz del
// monorepo y resolver los paquetes del workspace (`@dialog/core`) desde su
// código fuente TypeScript.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

- [ ] **Step 4: Habilitar la resolución del campo `exports` de los paquetes**

`@dialog/core` declara su entrada por el campo `exports` de su `package.json`. Abrir `apps/mobile/metro.config.js` y agregar, antes de `module.exports = config;`, esta línea:

```js
config.resolver.unstable_enablePackageExports = true;
```

- [ ] **Step 5: Instalar y verificar el typecheck**

Run: `pnpm install`
Then: `pnpm --filter @dialog/mobile typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(mobile): scaffold Expo app consuming @dialog/core"
```

---

## Task 5: Pantalla inicial y harness de tests de `apps/mobile`

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/jest.config.js`
- Create: `apps/mobile/src/demo/demoScript.ts`
- Test: `apps/mobile/src/demo/demoScript.test.ts`
- Modify: `apps/mobile/App.tsx`
- Test: `apps/mobile/App.test.tsx`

- [ ] **Step 1: Agregar las dependencias de testing y el script `test`**

Editar `apps/mobile/package.json`. Agregar a `devDependencies` (versiones para
Expo SDK 54 / React 19, que es lo que instaló el generador en la Task 4):

```json
    "jest": "^29.7.0",
    "jest-expo": "~54.0.0",
    "react-test-renderer": "19.1.0",
    "@testing-library/react-native": "^13.2.0"
```

`react-test-renderer` DEBE coincidir exactamente con la versión de `react`
instalada (`19.1.0`). Si `pnpm install` reporta un conflicto de peer deps,
ajustar las versiones a las que recomiende `npx expo install --check` dentro
de `apps/mobile`.

Agregar al bloque `scripts` la línea:

```json
    "test": "jest"
```

Run: `pnpm install`
Expected: instala las dependencias sin errores.

- [ ] **Step 2: Crear la config de Jest**

Crear `apps/mobile/jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};
```

- [ ] **Step 3: Escribir el test que falla para `buildDemoScript`**

Crear `apps/mobile/src/demo/demoScript.test.ts`:

```ts
import { describe, it, expect } from '@jest/globals';
import { validateScript, getSceneLines } from '@dialog/core';
import { buildDemoScript } from './demoScript';

describe('buildDemoScript', () => {
  it('arma un guion válido con una escena y al menos dos líneas', () => {
    const { script, scene } = buildDemoScript();

    expect(validateScript(script).valid).toBe(true);
    expect(script.scenes).toHaveLength(1);
    expect(getSceneLines(script, scene.id).length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 4: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/mobile test`
Expected: FAIL — no se puede resolver el módulo `./demoScript`.

- [ ] **Step 5: Implementar `buildDemoScript`**

Crear `apps/mobile/src/demo/demoScript.ts`:

```ts
// Contenido de demostración temporal. Se reemplaza al construir las pantallas
// reales (importación de guiones, ensayo). Sirve para verificar el cableado
// con `@dialog/core` de punta a punta.
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
  type Scene,
} from '@dialog/core';

export interface DemoScript {
  script: Script;
  scene: Scene;
}

/** Arma un guion de muestra con una escena, dos personajes y dos líneas. */
export function buildDemoScript(): DemoScript {
  const empty = createScript({
    title: 'Escena de práctica',
    ownerUid: 'demo',
  });
  const [withScene, scene] = addScene(empty, 'Acto I');
  const [withHamlet, hamlet] = addCharacter(withScene, 'Hamlet');
  const [withOfelia, ofelia] = addCharacter(withHamlet, 'Ofelia');
  const [withLine1] = addLine(withOfelia, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Ser o no ser, esa es la cuestión.',
  });
  const [withLine2] = addLine(withLine1, {
    sceneId: scene.id,
    characterId: ofelia.id,
    type: 'dialogue',
    text: 'Mi señor, ¿cómo os encontráis?',
  });
  return { script: withLine2, scene };
}
```

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/mobile test`
Expected: PASS — el test de `buildDemoScript` pasa.

- [ ] **Step 7: Escribir el smoke test de la pantalla**

Crear `apps/mobile/App.test.tsx`:

```tsx
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('muestra el título del guion de muestra y sus líneas', () => {
    render(<App />);

    expect(screen.getByText('Escena de práctica')).toBeTruthy();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 8: Correr el smoke test para verificar que falla**

Run: `pnpm --filter @dialog/mobile test`
Expected: FAIL — el `App.tsx` actual (el generado por Expo) no contiene esos textos.

- [ ] **Step 9: Implementar la pantalla inicial**

Reemplazar el contenido completo de `apps/mobile/App.tsx` por:

```tsx
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSceneLines } from '@dialog/core';
import { buildDemoScript } from './src/demo/demoScript';

export default function App() {
  const { script, scene } = buildDemoScript();
  const lines = getSceneLines(script, scene.id);
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{script.title}</Text>
        <Text style={styles.scene}>{scene.title}</Text>
        {lines.map((line) => (
          <Text key={line.id} style={styles.line}>
            <Text style={styles.character}>
              {characterName(line.characterId)}:{' '}
            </Text>
            {line.text}
          </Text>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 64, gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  scene: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  line: { fontSize: 16, lineHeight: 24 },
  character: { fontWeight: '700' },
});
```

- [ ] **Step 10: Correr los tests y el typecheck**

Run: `pnpm --filter @dialog/mobile test`
Expected: PASS — el test del helper y el smoke test de la pantalla pasan.

Then: `pnpm --filter @dialog/mobile typecheck`
Expected: termina sin errores.

- [ ] **Step 11: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(mobile): render demo script on the home screen with tests"
```

---

## Task 6: README y verificación del monorepo completo

**Files:**
- Create: `README.md`

- [ ] **Step 1: Crear el README**

Crear `README.md`:

```markdown
# dialog-training-actors

App multiplataforma para que actores memoricen y ensayen diálogos. Ver el
diseño en `docs/superpowers/specs/`.

## Estructura

- `packages/core` (`@dialog/core`) — modelo de dominio del guion, agnóstico de
  plataforma.
- `apps/web` (`@dialog/web`) — app web (Next.js).
- `apps/mobile` (`@dialog/mobile`) — app móvil (React Native + Expo).

## Requisitos

- Node 20+
- pnpm 9+

## Comandos del monorepo

```bash
pnpm install      # instala todas las dependencias
pnpm test         # corre los tests de todos los paquetes
pnpm typecheck    # chequea tipos en todos los paquetes
pnpm build        # build de producción de las apps
```

## Correr cada app

```bash
pnpm --filter @dialog/web dev      # web en modo desarrollo
pnpm --filter @dialog/mobile start # móvil con Expo (escanear QR con Expo Go)
```
```

- [ ] **Step 2: Verificar la suite completa del monorepo**

Run: `pnpm install`
Then: `pnpm test`
Expected: PASS — Turborepo corre los tests de `@dialog/core`, `@dialog/web` y `@dialog/mobile`; todos verdes.

Then: `pnpm typecheck`
Expected: `Tasks: 3 successful, 3 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito. (`@dialog/mobile` no tiene script `build` en esta fase; Turborepo lo omite sin error.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add monorepo README with app commands"
```

---

## Verificación final

Al terminar las 6 tareas:

- `pnpm install`, `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes desde la raíz.
- `apps/web` arranca con `pnpm --filter @dialog/web dev` y muestra el guion de muestra.
- `apps/mobile` arranca con `pnpm --filter @dialog/mobile start` y muestra el guion de muestra.
- Ambas apps consumen `@dialog/core` desde su código fuente, sin paso de build de librería.

Esto deja listo el esqueleto multiplataforma. El plan siguiente abordará `packages/data` y la integración con Firebase Auth (requiere que el proyecto Firebase exista en la consola).

---

## Self-Review

**Cobertura del spec:** Este plan implementa la parte de la sección 4 del spec correspondiente a `apps/mobile` (React Native + Expo) y `apps/web` (Next.js), y consume el `packages/core` ya construido. `packages/data`, `packages/ui`, `functions/` y la integración con Firebase quedan explícitamente fuera de alcance, para planes posteriores (indicado en la cabecera y en la verificación final). No hay huecos dentro del alcance declarado. La Task 1 además resuelve el pendiente de `turbo.json` registrado al cerrar la Fase 0.

**Placeholders:** No hay TODOs ni pasos sin contenido. Los archivos generados por `create-next-app`/`create-expo-app` no se transcriben (es imposible y frágil); el plan fija el comando del generador y da contenido exacto solo para los archivos creados o modificados a mano. El código de demostración (`demoScript.ts`) está marcado explícitamente como temporal — es intencional, no un placeholder de plan.

**Consistencia de tipos:** `buildDemoScript` y `DemoScript` se definen idénticos en `apps/web` y `apps/mobile`; ambos consumen `createScript`, `addScene`, `addCharacter`, `addLine`, `getSceneLines`, `validateScript` y los tipos `Script`/`Scene` con las firmas exactas que exporta `@dialog/core` (verificadas contra el plan de la Fase 0: builders devuelven tuplas `[Script, Entity]`, `addLine` toma `{ sceneId, characterId, type, text }`). Las pantallas (`page.tsx`, `App.tsx`) usan `getSceneLines(script, scene.id)` y `script.characters` de forma consistente con esos tipos.
