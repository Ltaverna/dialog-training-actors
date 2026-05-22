# Pantalla "Mis guiones" + Viewer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la pantalla "Mis guiones" de `apps/web` (lista en vivo de los guiones del usuario, crear/abrir/borrar, logout) y el viewer read-only de un guion, y mostrarlos cuando hay sesión iniciada.

**Architecture:** Componentes client-side en `apps/web/components/scripts/`. `MyScriptsScreen` usa `useScripts()` (lista en vivo vía `onSnapshot`) + `useAuth()` (email, logout, banner de email no verificado). "+ Nuevo guion" siembra un guion de muestra con el `uid` del usuario y lo guarda. El viewer vive en la ruta `/scripts/[id]`, lee el guion con `getScript` y lo renderiza con `<ScriptViewer>`. La home (`app/page.tsx`) renderiza `<MyScriptsScreen />` cuando `status === 'signedIn'`. Los tests mockean `@dialog/data`.

**Tech Stack:** Next.js 15 App Router (`next/link`, `next/navigation`), React 19, shadcn/ui (button), `@dialog/core` (modelo del guion), `@dialog/data` (`useAuth`, `useScripts`, `useFirebase`, `getScript`), Vitest + @testing-library/react + user-event (jsdom).

**Contexto del proyecto:** Plan 3 de 3 del spec `docs/superpowers/specs/2026-05-20-web-auth-ui-design.md`. Los planes 1 y 2 dejaron: la capa React de `@dialog/data` (`useAuth` → `{ user, status, signOut, ... }`; `useScripts` → `{ scripts: ScriptSummary[], status: 'loading'|'ready'|'error', error, create(script), remove(id) }`; `useFirebase` → `{ app, auth, db }`; y `getScript(db, id)` que devuelve `Script | null`), Tailwind + shadcn, y la pantalla de auth. La home hoy: `loading` → spinner; `signedOut` → `<AuthScreen />`; `signedIn` → un saludo placeholder con email + logout. Este plan reemplaza ese placeholder.

Tipos relevantes:
- `@dialog/core`: `Script = { id, title, ownerUid, characters[], scenes[], lines[] }`; builders `createScript`/`addScene`/`addCharacter`/`addLine`; selector `getSceneLines(script, sceneId)`; `validateScript`.
- `@dialog/data`: `ScriptSummary = { id, title, updatedAt }`; `AuthContextValue` (con `user`, `status`, `signOut`); `UseScriptsResult = { scripts, status, error, create, remove }`.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `apps/web/lib/demoScript.ts` | `buildStarterScript(ownerUid)` — guion de muestra para "+ Nuevo guion" |
| `apps/web/lib/demoScript.test.ts` | Test del helper |
| `apps/web/src/demo/demoScript.ts` (eliminar) | Helper viejo huérfano (ya no lo usa nadie) |
| `apps/web/src/demo/demoScript.test.ts` (eliminar) | Test del helper viejo |
| `apps/web/components/scripts/ScriptViewer.tsx` | Render read-only de un `Script` |
| `apps/web/components/scripts/ScriptViewer.test.tsx` | Test del viewer |
| `apps/web/components/scripts/MyScriptsScreen.tsx` | Lista + crear/abrir/borrar + logout + banner |
| `apps/web/components/scripts/MyScriptsScreen.test.tsx` | Test de la pantalla |
| `apps/web/app/scripts/[id]/page.tsx` | Ruta del viewer (lee con `getScript`) |
| `apps/web/app/scripts/[id]/page.test.tsx` | Test de la ruta |
| `apps/web/app/page.tsx` (modif.) | `signedIn` → `<MyScriptsScreen />` |
| `apps/web/app/page.test.tsx` (modif.) | Actualizar el caso `signedIn` |

---

## Task 1: Helper `buildStarterScript` (y limpieza del demo viejo)

**Files:**
- Create: `apps/web/lib/demoScript.ts`
- Test: `apps/web/lib/demoScript.test.ts`
- Delete: `apps/web/src/demo/demoScript.ts`, `apps/web/src/demo/demoScript.test.ts`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/lib/demoScript.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateScript, getSceneLines } from '@dialog/core';
import { buildStarterScript } from './demoScript';

describe('buildStarterScript', () => {
  it('arma un guion válido del dueño con una escena y al menos dos líneas', () => {
    const script = buildStarterScript('owner-1');
    expect(script.ownerUid).toBe('owner-1');
    expect(validateScript(script).valid).toBe(true);
    expect(script.scenes).toHaveLength(1);
    const scene = script.scenes[0];
    if (scene === undefined) {
      throw new Error('expected a scene');
    }
    expect(getSceneLines(script, scene.id).length).toBeGreaterThanOrEqual(2);
  });

  it('asigna ids únicos a cada guion creado', () => {
    const a = buildStarterScript('owner-1');
    const b = buildStarterScript('owner-1');
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./demoScript`.

- [ ] **Step 3: Implementar el helper** — Create `apps/web/lib/demoScript.ts`:

```ts
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
} from '@dialog/core';

/**
 * Arma un guion de muestra (una escena, dos personajes, dos líneas) cuyo dueño
 * es `ownerUid`. Lo usa el botón "+ Nuevo guion" para sembrar el primer guion
 * mientras todavía no existe el editor real.
 */
export function buildStarterScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Escena de práctica', ownerUid });
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
  return withLine2;
}
```

- [ ] **Step 4: Borrar el helper viejo huérfano**

Eliminar `apps/web/src/demo/demoScript.ts` y `apps/web/src/demo/demoScript.test.ts`. (Ya no los importa nadie: la home dejó de renderizar el demo en los planes anteriores. Verificá con `grep -r "src/demo/demoScript" apps/web` que no haya referencias antes de borrar; si aparece alguna, reportá BLOCKED.)

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 2 tests de `buildStarterScript` pasan; los demás siguen verdes (el del demo viejo ya no existe).

- [ ] **Step 6: typecheck** — `pnpm --filter @dialog/web typecheck` clean.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/demoScript.ts apps/web/lib/demoScript.test.ts apps/web/src/demo
git commit -m "feat(web): add owner-scoped starter script helper, drop orphan demo"
```

## Context (Task 1)

Plan 3, Task 1. `@dialog/core` exporta los builders y `Script`. El helper anterior (`apps/web/src/demo/demoScript.ts`, con `buildDemoScript()` y `ownerUid: 'demo'` hardcodeado) quedó huérfano al reescribirse la home; este lo reemplaza con uno parametrizado por `ownerUid`. Work from repo root, branch de la fase. NO tocar `docs/`, `packages/`, `apps/mobile/`.

---

## Task 2: `ScriptViewer`

**Files:**
- Create: `apps/web/components/scripts/ScriptViewer.tsx`
- Test: `apps/web/components/scripts/ScriptViewer.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/scripts/ScriptViewer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildStarterScript } from '@/lib/demoScript';
import { ScriptViewer } from './ScriptViewer';

describe('ScriptViewer', () => {
  it('renderiza el título, la escena y las líneas con su personaje', () => {
    const script = buildStarterScript('owner-1');
    render(<ScriptViewer script={script} />);

    expect(
      screen.getByRole('heading', { name: 'Escena de práctica' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Acto I' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Hamlet:')).toBeInTheDocument();
    expect(screen.getByText('Ofelia:')).toBeInTheDocument();
  });
});
```

(Nota: el personaje se renderiza como `"Hamlet: "` con el espacio dentro de un `<span>`; `getByText('Hamlet:')` matchea por defecto ignorando el espacio final por la normalización de Testing Library.)

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./ScriptViewer`.

- [ ] **Step 3: Implementar `ScriptViewer`** — Create `apps/web/components/scripts/ScriptViewer.tsx`:

```tsx
'use client';

import { getSceneLines, type Script } from '@dialog/core';

export function ScriptViewer({ script }: { script: Script }) {
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <article className="grid gap-6">
      <h1 className="text-2xl font-bold">{script.title}</h1>
      {script.scenes.map((scene) => (
        <section key={scene.id} className="grid gap-2">
          <h2 className="text-lg font-semibold">{scene.title}</h2>
          <ol className="grid gap-1">
            {getSceneLines(script, scene.id).map((line) => (
              <li key={line.id}>
                <span className="font-semibold">
                  {characterName(line.characterId)}:{' '}
                </span>
                {line.text}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — el test de `ScriptViewer` pasa.

- [ ] **Step 5: typecheck** — `pnpm --filter @dialog/web typecheck` clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/scripts/ScriptViewer.tsx apps/web/components/scripts/ScriptViewer.test.tsx
git commit -m "feat(web): add read-only script viewer"
```

## Context (Task 2)

Plan 3, Task 2. `ScriptViewer` es un render puro de un `Script` de `@dialog/core`: usa `getSceneLines` para ordenar las líneas de cada escena y muestra el personaje (o "Acotación" si `characterId` es null). No hace I/O. NO tocar otras áreas.

---

## Task 3: `MyScriptsScreen`

**Files:**
- Create: `apps/web/components/scripts/MyScriptsScreen.tsx`
- Test: `apps/web/components/scripts/MyScriptsScreen.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/scripts/MyScriptsScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue, UseScriptsResult } from '@dialog/data';
import { useAuth, useScripts } from '@dialog/data';
import { MyScriptsScreen } from './MyScriptsScreen';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn(), useScripts: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseScripts = vi.mocked(useScripts);

function mockAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: {
      uid: 'uid-1',
      email: 'actor@example.com',
      emailVerified: true,
    } as AuthContextValue['user'],
    status: 'signedIn',
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signInWithApple: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockScripts(
  overrides: Partial<UseScriptsResult> = {},
): UseScriptsResult {
  return {
    scripts: [],
    status: 'ready',
    error: null,
    create: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MyScriptsScreen', () => {
  it('muestra el email del usuario y un estado vacío sin guiones', () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(mockScripts({ scripts: [] }));
    render(<MyScriptsScreen />);
    expect(screen.getByText('actor@example.com')).toBeInTheDocument();
    expect(screen.getByText(/todavía no tenés guiones/i)).toBeInTheDocument();
  });

  it('lista los guiones con enlaces para abrir', () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({
        scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }],
      }),
    );
    render(<MyScriptsScreen />);
    expect(screen.getByText('Hamlet')).toBeInTheDocument();
    const open = screen.getByRole('link', { name: 'Abrir' });
    expect(open).toHaveAttribute('href', '/scripts/s1');
  });

  it('crea un guion del usuario al hacer click en "+ Nuevo guion"', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(mockScripts({ create }));
    render(<MyScriptsScreen />);
    await userEvent.click(
      screen.getByRole('button', { name: /nuevo guion/i }),
    );
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0].ownerUid).toBe('uid-1');
  });

  it('borra un guion tras confirmar', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({
        scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }],
        remove,
      }),
    );
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('s1'));
  });

  it('no borra si el usuario cancela la confirmación', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({
        scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }],
        remove,
      }),
    );
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(remove).not.toHaveBeenCalled();
  });

  it('cierra sesión al hacer click en "Cerrar sesión"', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signOut }));
    mockedUseScripts.mockReturnValue(mockScripts());
    render(<MyScriptsScreen />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it('muestra el banner de email no verificado solo si corresponde', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        user: {
          uid: 'uid-1',
          email: 'actor@example.com',
          emailVerified: false,
        } as AuthContextValue['user'],
      }),
    );
    mockedUseScripts.mockReturnValue(mockScripts());
    render(<MyScriptsScreen />);
    expect(screen.getByText(/verificá tu email/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./MyScriptsScreen`.

- [ ] **Step 3: Implementar `MyScriptsScreen`** — Create `apps/web/components/scripts/MyScriptsScreen.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth, useScripts } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { buildStarterScript } from '@/lib/demoScript';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

export function MyScriptsScreen() {
  const { user, signOut } = useAuth();
  const { scripts, status, create, remove } = useScripts();
  const [creating, setCreating] = useState(false);

  async function handleCreate(): Promise<void> {
    if (user === null) {
      return;
    }
    setCreating(true);
    try {
      await create(buildStarterScript(user.uid));
    } catch (e) {
      toast.error(firebaseErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string): Promise<void> {
    if (!window.confirm(`¿Borrar "${title}"?`)) {
      return;
    }
    try {
      await remove(id);
    } catch (e) {
      toast.error(firebaseErrorMessage(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mis guiones</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </header>

      {user !== null && !user.emailVerified && (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Verificá tu email para asegurar tu cuenta.
        </p>
      )}

      <Button onClick={() => void handleCreate()} disabled={creating}>
        {creating ? 'Creando…' : '+ Nuevo guion'}
      </Button>

      {status === 'loading' ? (
        <p className="text-muted-foreground">Cargando guiones…</p>
      ) : scripts.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no tenés guiones. Creá el primero con “+ Nuevo guion”.
        </p>
      ) : (
        <ul className="grid gap-2">
          {scripts.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className="font-medium">{s.title}</span>
              <span className="flex items-center gap-3">
                <Link
                  href={`/scripts/${s.id}`}
                  className="text-sm underline"
                >
                  Abrir
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(s.id, s.title)}
                >
                  Borrar
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 7 tests de `MyScriptsScreen` pasan.

- [ ] **Step 5: typecheck** — `pnpm --filter @dialog/web typecheck` clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/scripts/MyScriptsScreen.tsx apps/web/components/scripts/MyScriptsScreen.test.tsx
git commit -m "feat(web): add my-scripts screen with create/open/delete"
```

## Context (Task 3)

Plan 3, Task 3. `MyScriptsScreen` consume `useScripts()` (lista en vivo + `create`/`remove`) y `useAuth()` (email, `signOut`, `user.emailVerified`). "+ Nuevo guion" usa `buildStarterScript(user.uid)` (Task 1). "Borrar" confirma con `window.confirm`. Errores → `toast.error(firebaseErrorMessage(e))`. shadcn `Button` y `next/link` ya están disponibles. NO tocar otras áreas.

---

## Task 4: Ruta del viewer `/scripts/[id]`

**Files:**
- Create: `apps/web/app/scripts/[id]/page.tsx`
- Test: `apps/web/app/scripts/[id]/page.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/app/scripts/[id]/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue } from '@dialog/data';
import { useAuth, useFirebase, getScript } from '@dialog/data';
import { buildStarterScript } from '@/lib/demoScript';
import ScriptPage from './page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'script-1' }) }));
vi.mock('@dialog/data', () => ({
  useAuth: vi.fn(),
  useFirebase: vi.fn(),
  getScript: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseFirebase = vi.mocked(useFirebase);
const mockedGetScript = vi.mocked(getScript);

function signedInAuth(): AuthContextValue {
  return {
    user: { uid: 'uid-1', email: 'a@example.com' } as AuthContextValue['user'],
    status: 'signedIn',
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    sendPasswordReset: vi.fn(),
    signOut: vi.fn(),
  } as AuthContextValue;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseFirebase.mockReturnValue({
    app: {},
    auth: {},
    db: {},
  } as ReturnType<typeof useFirebase>);
});

describe('ScriptPage', () => {
  it('carga y renderiza el guion', async () => {
    mockedUseAuth.mockReturnValue(signedInAuth());
    mockedGetScript.mockResolvedValue(buildStarterScript('uid-1'));
    render(<ScriptPage />);
    expect(
      await screen.findByRole('heading', { name: 'Escena de práctica' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver/i })).toBeInTheDocument();
  });

  it('muestra "no encontrado" si el guion no existe', async () => {
    mockedUseAuth.mockReturnValue(signedInAuth());
    mockedGetScript.mockResolvedValue(null);
    render(<ScriptPage />);
    expect(
      await screen.findByText(/no encontramos ese guion/i),
    ).toBeInTheDocument();
  });

  it('pide iniciar sesión si no hay sesión', () => {
    mockedUseAuth.mockReturnValue({
      ...signedInAuth(),
      status: 'signedOut',
      user: null,
    });
    render(<ScriptPage />);
    expect(screen.getByText(/iniciá sesión/i)).toBeInTheDocument();
    expect(mockedGetScript).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./page` (la ruta no existe).

- [ ] **Step 3: Implementar la ruta** — Create `apps/web/app/scripts/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getScript, useAuth, useFirebase } from '@dialog/data';
import type { Script } from '@dialog/core';
import { ScriptViewer } from '@/components/scripts/ScriptViewer';

type ViewState = 'loading' | 'ready' | 'notfound';

export default function ScriptPage() {
  const params = useParams<{ id: string }>();
  const { db } = useFirebase();
  const { status } = useAuth();
  const [script, setScript] = useState<Script | null>(null);
  const [view, setView] = useState<ViewState>('loading');

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }
    let active = true;
    void getScript(db, params.id).then((loaded) => {
      if (!active) {
        return;
      }
      if (loaded === null) {
        setView('notfound');
      } else {
        setScript(loaded);
        setView('ready');
      }
    });
    return () => {
      active = false;
    };
  }, [db, params.id, status]);

  if (status === 'signedOut') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">
          Iniciá sesión para ver este guion.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <Link href="/" className="text-sm underline">
        ← Volver
      </Link>
      {view === 'loading' && (
        <p className="text-muted-foreground">Cargando guion…</p>
      )}
      {view === 'notfound' && (
        <p className="text-muted-foreground">No encontramos ese guion.</p>
      )}
      {view === 'ready' && script !== null && <ScriptViewer script={script} />}
    </main>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 3 tests de `ScriptPage` pasan.

- [ ] **Step 5: typecheck** — `pnpm --filter @dialog/web typecheck` clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/scripts
git commit -m "feat(web): add read-only script viewer route"
```

## Context (Task 4)

Plan 3, Task 4. La ruta es un client component: lee el `id` con `useParams` (`next/navigation`), el `db` con `useFirebase()`, y llama a `getScript(db, id)` en un efecto (con flag `active` para evitar setState tras desmontar). Si no hay sesión muestra un mensaje. Renderiza `<ScriptViewer>` (Task 2) cuando carga. NO tocar otras áreas.

---

## Task 5: Conectar la home con `MyScriptsScreen`

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/page.test.tsx`

- [ ] **Step 1: Actualizar el test de la home** — Reemplazar el contenido completo de `apps/web/app/page.test.tsx` por:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue, UseScriptsResult } from '@dialog/data';
import { useAuth, useScripts } from '@dialog/data';
import Home from './page';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn(), useScripts: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseScripts = vi.mocked(useScripts);

function mockAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'signedOut',
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signInWithApple: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockScripts(): UseScriptsResult {
  return {
    scripts: [],
    status: 'ready',
    error: null,
    create: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseScripts.mockReturnValue(mockScripts());
});

describe('Home', () => {
  it('muestra "Cargando…" mientras el estado es loading', () => {
    mockedUseAuth.mockReturnValue(mockAuth({ status: 'loading' }));
    render(<Home />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra la pantalla de autenticación cuando no hay sesión', () => {
    mockedUseAuth.mockReturnValue(mockAuth({ status: 'signedOut' }));
    render(<Home />);
    expect(screen.getByRole('tab', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('muestra "Mis guiones" cuando hay sesión', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        status: 'signedIn',
        user: {
          uid: 'uid-1',
          email: 'actor@example.com',
          emailVerified: true,
        } as AuthContextValue['user'],
      }),
    );
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: 'Mis guiones' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — el caso `signedIn` no encuentra el heading "Mis guiones" (la home todavía muestra el saludo placeholder).

- [ ] **Step 3: Reemplazar el contenido de `apps/web/app/page.tsx`** por:

```tsx
'use client';

import { useAuth } from '@dialog/data';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { MyScriptsScreen } from '@/components/scripts/MyScriptsScreen';

export default function Home() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (status === 'signedOut') {
    return <AuthScreen />;
  }

  return <MyScriptsScreen />;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 3 tests de `Home` pasan; todos los demás siguen verdes.

- [ ] **Step 5: typecheck** — `pnpm --filter @dialog/web typecheck` clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/page.test.tsx
git commit -m "feat(web): show my-scripts screen on the home when signed in"
```

## Context (Task 5)

Plan 3, Task 5. La home pasa a delegar todo a tres componentes según `status`: spinner / `<AuthScreen>` / `<MyScriptsScreen>`. Ya no usa `user`/`signOut` directamente (eso vive ahora en `MyScriptsScreen`). El test de la home mockea `useAuth` Y `useScripts` (porque `MyScriptsScreen` consume ambos). NO tocar otras áreas.

---

## Task 6: Verificación del monorepo

**Files:** (ninguno — solo verificación)

- [ ] **Step 1: Correr la suite completa**

Run: `pnpm test`
Expected: PASS — los 4 paquetes verdes.

Then: `pnpm typecheck`
Expected: `Tasks: 4 successful, 4 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito (incluye la nueva ruta `/scripts/[id]`).

- [ ] **Step 2: Commit (solo si quedó el lockfile sin commitear)**

Si `git status` muestra cambios en `pnpm-lock.yaml`, commitealos:

```bash
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

Si no, omitir.

---

## Verificación final

Al terminar las 6 tareas:

- Con sesión iniciada, la home muestra "Mis guiones": lista en vivo de los
  guiones del usuario, "+ Nuevo guion" (siembra un guion del usuario), "Abrir"
  (lleva al viewer), "Borrar" (con confirmación), "Cerrar sesión", y un banner
  si el email no está verificado.
- `/scripts/[id]` muestra el guion en modo lectura con un botón "Volver".
- `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes.

Esto completa la **fase de UI de autenticación y guiones en web**. La siguiente
fase del producto será la UI equivalente en móvil, o avanzar con el editor de
guiones / el motor de ensayo (según prioridad).

---

## Self-Review

**Cobertura del spec:** Implementa la sección 5 (componentes 4 "Mis guiones" y
5 "Viewer") y los flujos 6-8 de la sección 6 del spec
`2026-05-20-web-auth-ui-design.md`: lista en vivo, crear (sembrado), abrir en
modo lectura, borrar con confirmación, logout, y el banner de email no
verificado (informativo; el botón "reenviar verificación" se difiere porque
requeriría sumar una acción a `@dialog/data` y queda fuera del alcance de UI
de este plan — anotado como mejora futura). Con esto la fase de UI web queda
completa.

**Placeholders:** No hay TODOs ni pasos sin contenido. La nota sobre el botón
"reenviar verificación" diferido es una decisión de alcance explícita.

**Consistencia de tipos:** `MyScriptsScreen` consume `useScripts()`
(`UseScriptsResult` = `{ scripts, status, error, create, remove }`) y
`useAuth()` (`AuthContextValue`); usa `ScriptSummary` (`{ id, title, updatedAt }`)
para las filas. El viewer usa `getScript(db, id): Promise<Script | null>` y
`useFirebase()` (`{ app, auth, db }`). `ScriptViewer` usa `getSceneLines` y los
tipos de `@dialog/core`. `buildStarterScript(ownerUid): Script` se define en
Task 1 y se usa en Tasks 3 y 4 (tests). Todas las firmas coinciden con lo que
exporta `@dialog/data`/`@dialog/core` de los planes anteriores. El test de la
home (Task 5) mockea tanto `useAuth` como `useScripts` porque `MyScriptsScreen`
consume ambos.
