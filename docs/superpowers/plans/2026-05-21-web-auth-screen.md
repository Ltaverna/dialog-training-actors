# Pantalla de Autenticación Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la pantalla de autenticación de `apps/web` — login, registro y reseteo de contraseña con email (validados con react-hook-form + zod), más botones de Google y Apple — y mostrarla en la home cuando no hay sesión.

**Architecture:** Componentes client-side en `apps/web/components/auth/`. Cada formulario usa `useAuth()` de `@dialog/data` para la acción correspondiente, valida con zod, muestra errores de validación inline (vía el `FormMessage` de shadcn) y errores de Firebase traducidos al español (vía `firebaseErrorMessage`). `AuthScreen` agrupa login/registro en tabs y permite cambiar a la vista de reseteo. La home (`app/page.tsx`) renderiza `<AuthScreen />` cuando `status === 'signedOut'`. Los tests mockean `@dialog/data` (no levantan Firebase).

**Tech Stack:** Next.js 15, React 19, shadcn/ui (form, input, button, card, tabs), react-hook-form + zod + @hookform/resolvers, Vitest + @testing-library/react + @testing-library/user-event (jsdom).

**Contexto del proyecto:** Plan 2 de 3 del spec `docs/superpowers/specs/2026-05-20-web-auth-ui-design.md`. El plan 1 dejó listo: Tailwind + shadcn en `apps/web` (componentes `button`, `input`, `label`, `card`, `tabs`, `sonner`, `form` en `components/ui/`), `lib/firebase.ts`, `lib/firebase-errors.ts` (`firebaseErrorMessage`, `isPopupCancelled`), y la capa React de `@dialog/data` (`useAuth` expone `{ user, status, signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithApple, sendPasswordReset, signOut }`). La home actual muestra un placeholder por status.

**Nota sobre shadcn v4:** se usa el estilo `base-nova` con `@base-ui/react`. Los componentes mantienen los nombres de export usuales (`Button`, `Input`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, y `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`). Si algún nombre o sub-API difiere en esta variante, ajustar el uso al export real del componente (sin cambiar el comportamiento pedido) y reportarlo.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `apps/web/package.json` (modif.) | Sumar `@testing-library/user-event` (devDep) |
| `apps/web/components/auth/SocialButtons.tsx` | Botones "Continuar con Google/Apple"; ignora popup cancelado, toast en otros errores |
| `apps/web/components/auth/LoginForm.tsx` | Form email+password → `signInWithEmail` |
| `apps/web/components/auth/RegisterForm.tsx` | Form email+password(≥8) → `signUpWithEmail` |
| `apps/web/components/auth/ResetPasswordForm.tsx` | Form email → `sendPasswordReset`, con mensaje de éxito inline |
| `apps/web/components/auth/AuthScreen.tsx` | Tabs login/registro + cambio a vista de reseteo + social |
| `apps/web/components/auth/*.test.tsx` | Tests de cada componente (mockean `@dialog/data`) |
| `apps/web/app/page.tsx` (modif.) | Renderiza `<AuthScreen />` cuando `signedOut` |
| `apps/web/app/page.test.tsx` | Test del render por status |

---

## Task 1: `SocialButtons` (+ dependencia de testing)

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/components/auth/SocialButtons.tsx`
- Test: `apps/web/components/auth/SocialButtons.test.tsx`

- [ ] **Step 1: Agregar `@testing-library/user-event`**

Editar `apps/web/package.json` y agregar a `devDependencies`:

```json
    "@testing-library/user-event": "^14.5.2"
```

Run: `pnpm install`
Expected: instala sin errores.

- [ ] **Step 2: Escribir el test que falla** — Create `apps/web/components/auth/SocialButtons.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { toast } from 'sonner';
import { SocialButtons } from './SocialButtons';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SocialButtons', () => {
  it('llama signInWithGoogle al hacer click en el botón de Google', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(
      screen.getByRole('button', { name: /google/i }),
    );
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('llama signInWithApple al hacer click en el botón de Apple', async () => {
    const signInWithApple = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithApple }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /apple/i }));
    expect(signInWithApple).toHaveBeenCalledTimes(1);
  });

  it('ignora silenciosamente el popup cancelado (no muestra toast)', async () => {
    const signInWithGoogle = vi
      .fn()
      .mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('muestra un toast con el mensaje traducido ante otros errores', async () => {
    const signInWithGoogle = vi
      .fn()
      .mockRejectedValue({ code: 'auth/network-request-failed' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Sin conexión. Probá de nuevo.'),
    );
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./SocialButtons`.

- [ ] **Step 4: Implementar `SocialButtons`** — Create `apps/web/components/auth/SocialButtons.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { firebaseErrorMessage, isPopupCancelled } from '@/lib/firebase-errors';

export function SocialButtons() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      if (!isPopupCancelled(e)) {
        toast.error(firebaseErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        Continuar con Google
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => void run(signInWithApple)}
      >
        Continuar con Apple
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 4 tests de `SocialButtons` pasan; los anteriores siguen verdes.

- [ ] **Step 6: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): add social sign-in buttons"
```

---

## Task 2: `LoginForm`

**Files:**
- Create: `apps/web/components/auth/LoginForm.tsx`
- Test: `apps/web/components/auth/LoginForm.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/auth/LoginForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { LoginForm } from './LoginForm';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginForm', () => {
  it('llama signInWithEmail con las credenciales ingresadas', async () => {
    const signInWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithEmail }));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(signInWithEmail).toHaveBeenCalledWith(
        'actor@example.com',
        'secret123',
      ),
    );
  });

  it('muestra un error de validación si el email es inválido', async () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'no-es-email');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
  });

  it('muestra el error de Firebase traducido cuando el login falla', async () => {
    const signInWithEmail = vi
      .fn()
      .mockRejectedValue({ code: 'auth/invalid-credential' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithEmail }));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(
      await screen.findByText('Email o contraseña incorrectos.'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./LoginForm`.

- [ ] **Step 3: Implementar `LoginForm`** — Create `apps/web/components/auth/LoginForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const { signInWithEmail } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues): Promise<void> {
    setFormError(null);
    try {
      await signInWithEmail(values.email, values.password);
    } catch (e) {
      setFormError(firebaseErrorMessage(e));
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError !== null && (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 3 tests de `LoginForm` pasan.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores. (Si `zodResolver(schema)` da un error de tipos por la combinación zod v4 / @hookform/resolvers v5, tipá el `useForm` como `useForm<LoginValues>({ resolver: zodResolver(schema) as Resolver<LoginValues> })` importando `type { Resolver } from 'react-hook-form'`; reportalo si lo necesitás.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth
git commit -m "feat(web): add email login form"
```

---

## Task 3: `RegisterForm`

**Files:**
- Create: `apps/web/components/auth/RegisterForm.tsx`
- Test: `apps/web/components/auth/RegisterForm.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/auth/RegisterForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { RegisterForm } from './RegisterForm';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterForm', () => {
  it('llama signUpWithEmail con email y contraseña válidos', async () => {
    const signUpWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'nuevo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() =>
      expect(signUpWithEmail).toHaveBeenCalledWith(
        'nuevo@example.com',
        'secret123',
      ),
    );
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const signUpWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'nuevo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'corta');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it('muestra el error de Firebase traducido si el email ya existe', async () => {
    const signUpWithEmail = vi
      .fn()
      .mockRejectedValue({ code: 'auth/email-already-in-use' });
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'existe@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(
      await screen.findByText('Ya existe una cuenta con ese email.'),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./RegisterForm`.

- [ ] **Step 3: Implementar `RegisterForm`** — Create `apps/web/components/auth/RegisterForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type RegisterValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { signUpWithEmail } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: RegisterValues): Promise<void> {
    setFormError(null);
    try {
      await signUpWithEmail(values.email, values.password);
    } catch (e) {
      setFormError(firebaseErrorMessage(e));
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError !== null && (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 3 tests de `RegisterForm` pasan.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth
git commit -m "feat(web): add registration form"
```

---

## Task 4: `ResetPasswordForm`

**Files:**
- Create: `apps/web/components/auth/ResetPasswordForm.tsx`
- Test: `apps/web/components/auth/ResetPasswordForm.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/auth/ResetPasswordForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { ResetPasswordForm } from './ResetPasswordForm';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResetPasswordForm', () => {
  it('llama sendPasswordReset y muestra el mensaje de éxito', async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ sendPasswordReset }));
    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(sendPasswordReset).toHaveBeenCalledWith('actor@example.com'),
    );
    expect(
      await screen.findByText(/te enviamos un link/i),
    ).toBeInTheDocument();
  });

  it('valida el email antes de enviar', async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ sendPasswordReset }));
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'no-es-email');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./ResetPasswordForm`.

- [ ] **Step 3: Implementar `ResetPasswordForm`** — Create `apps/web/components/auth/ResetPasswordForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type ResetValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const { sendPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ResetValues): Promise<void> {
    setFormError(null);
    try {
      await sendPasswordReset(values.email);
      setSent(true);
    } catch (e) {
      setFormError(firebaseErrorMessage(e));
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Si existe una cuenta con ese email, te enviamos un link para resetear
        la contraseña.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formError !== null && (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Enviando…' : 'Enviar'}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 2 tests de `ResetPasswordForm` pasan.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth
git commit -m "feat(web): add password reset form"
```

---

## Task 5: `AuthScreen`

**Files:**
- Create: `apps/web/components/auth/AuthScreen.tsx`
- Test: `apps/web/components/auth/AuthScreen.test.tsx`

- [ ] **Step 1: Escribir el test que falla** — Create `apps/web/components/auth/AuthScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { AuthScreen } from './AuthScreen';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue(mockAuth());
});

describe('AuthScreen', () => {
  it('muestra las pestañas de ingresar y crear cuenta', () => {
    render(<AuthScreen />);
    expect(
      screen.getByRole('tab', { name: 'Ingresar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Crear cuenta' }),
    ).toBeInTheDocument();
  });

  it('cambia a la vista de reseteo y vuelve', async () => {
    render(<AuthScreen />);
    await userEvent.click(
      screen.getByRole('button', { name: /olvidaste tu contraseña/i }),
    );
    // En la vista de reseteo aparece el botón "Enviar" y no las pestañas.
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Ingresar' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(
      screen.getByRole('tab', { name: 'Ingresar' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — no se puede resolver `./AuthScreen`.

- [ ] **Step 3: Implementar `AuthScreen`** — Create `apps/web/components/auth/AuthScreen.tsx`:

```tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { SocialButtons } from './SocialButtons';

export function AuthScreen() {
  const [mode, setMode] = useState<'auth' | 'reset'>('auth');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
          <CardDescription>
            {mode === 'reset'
              ? 'Recuperá tu contraseña'
              : 'Ingresá para practicar tus diálogos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'reset' ? (
            <div className="grid gap-4">
              <ResetPasswordForm />
              <Button
                type="button"
                variant="link"
                className="justify-self-start px-0"
                onClick={() => setMode('auth')}
              >
                Volver
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Ingresar</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="grid gap-4 pt-4">
                <LoginForm />
                <Button
                  type="button"
                  variant="link"
                  className="justify-self-start px-0"
                  onClick={() => setMode('reset')}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
                <SocialButtons />
              </TabsContent>
              <TabsContent value="register" className="grid gap-4 pt-4">
                <RegisterForm />
                <SocialButtons />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 2 tests de `AuthScreen` pasan. (Si los roles `tab`/`tabpanel` no aplican porque el `Tabs` de esta variante shadcn usa otra estructura ARIA, ajustá los selectores del test al markup real — ej. `getByText('Ingresar')` — sin cambiar la intención.)

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/auth
git commit -m "feat(web): add auth screen with login/register tabs and reset"
```

---

## Task 6: Conectar la home con `AuthScreen`

**Files:**
- Modify: `apps/web/app/page.tsx`
- Test: `apps/web/app/page.test.tsx`

- [ ] **Step 1: Escribir el test del render por status** — Create `apps/web/app/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import Home from './page';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
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
    expect(
      screen.getByRole('tab', { name: 'Ingresar' }),
    ).toBeInTheDocument();
  });

  it('saluda con el email cuando hay sesión', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        status: 'signedIn',
        user: { email: 'actor@example.com' } as AuthContextValue['user'],
      }),
    );
    render(<Home />);
    expect(screen.getByText(/actor@example\.com/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `pnpm --filter @dialog/web test`
Expected: FAIL — el caso `signedOut` espera el tab "Ingresar" pero la home todavía muestra el placeholder de texto.

- [ ] **Step 3: Reemplazar la rama `signedOut` de la home por `<AuthScreen />`**

Reemplazar el contenido completo de `apps/web/app/page.tsx` por:

```tsx
'use client';

import { useAuth } from '@dialog/data';
import { AuthScreen } from '@/components/auth/AuthScreen';

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
    return <AuthScreen />;
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

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `pnpm --filter @dialog/web test`
Expected: PASS — los 3 tests de `Home` pasan; todos los anteriores siguen verdes.

- [ ] **Step 5: Verificar el typecheck**

Run: `pnpm --filter @dialog/web typecheck`
Expected: termina sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/page.test.tsx
git commit -m "feat(web): show auth screen on the home when signed out"
```

---

## Task 7: Verificación del monorepo

**Files:** (ninguno — solo verificación)

- [ ] **Step 1: Correr la suite completa**

Run: `pnpm test`
Expected: PASS — los 4 paquetes verdes; `@dialog/web` ahora incluye los tests de los formularios, `AuthScreen` y `Home`.

Then: `pnpm typecheck`
Expected: `Tasks: 4 successful, 4 total`.

Then: `pnpm build`
Expected: el build de `@dialog/web` termina con éxito.

- [ ] **Step 2: Commit (solo si `pnpm install` actualizó el lockfile en alguna tarea previa y quedó sin commitear)**

Si `git status` muestra cambios en `pnpm-lock.yaml`:

```bash
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

Si no hay cambios, omitir.

---

## Verificación final

Al terminar las 7 tareas:

- `apps/web` tiene la pantalla de autenticación completa: login, registro,
  reseteo y botones de Google/Apple.
- Los formularios validan con zod, muestran errores de validación inline y
  errores de Firebase traducidos al español.
- La home renderiza `<AuthScreen />` cuando no hay sesión.
- `pnpm test`, `pnpm typecheck` y `pnpm build` corren verdes.

El plan siguiente (plan 3) construirá la pantalla "Mis guiones" + el viewer
read-only, que se mostrarán cuando `status === 'signedIn'`.

---

## Self-Review

**Cobertura del spec:** Implementa la sección 5 (componente 3: pantalla de
autenticación) y los flujos 2-5 y 9 de la sección 6 del spec
`2026-05-20-web-auth-ui-design.md`, más la sección 7 (errores: inline para
formularios, toast para el social cancelado/fallido). La pantalla "Mis
guiones" + viewer (componente 4-5, flujos 6-8) quedan para el plan 3, como
indica la verificación final.

**Placeholders:** No hay TODOs ni pasos sin contenido. Las notas sobre
posibles ajustes de selectores ARIA / tipos de `zodResolver` son contingencias
explícitas para variaciones de la librería, no placeholders.

**Consistencia de tipos:** Todos los formularios consumen `useAuth()`
(`AuthContextValue` de `@dialog/data`) y llaman a las acciones con las firmas
reales: `signInWithEmail(email, password)`, `signUpWithEmail(email, password)`,
`sendPasswordReset(email)`, `signInWithGoogle()`, `signInWithApple()`. El
helper `mockAuth` construye un `AuthContextValue` completo en cada test.
`firebaseErrorMessage` / `isPopupCancelled` se usan con las firmas definidas en
el plan anterior. Los componentes de shadcn (`Form`, `FormField`, `FormItem`,
`FormLabel`, `FormControl`, `FormMessage`, `Button`, `Input`, `Card*`, `Tabs*`)
se importan de `@/components/ui/*` tal como quedaron del plan 1.
