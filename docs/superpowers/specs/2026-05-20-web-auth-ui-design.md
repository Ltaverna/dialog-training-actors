# Diseño — UI de autenticación y "Mis guiones" en la web

**Fecha:** 2026-05-20
**Estado:** Aprobado para pasar a planes de implementación

## 1. Contexto y objetivo

Continúa el producto descrito en
`docs/superpowers/specs/2026-05-17-actor-dialogue-practice-app-design.md`. Las
fases previas entregaron el monorepo, `@dialog/core`, las apps `web` (Next.js
15) y `mobile` (Expo) con pantallas de demostración, y `@dialog/data` con
`initFirebase()`, el servicio de autenticación y los repositorios de Firestore
con reglas de seguridad.

Esta fase trae **la UI real de autenticación y de guiones en `apps/web`**: un
actor puede crear una cuenta, iniciar sesión (email/contraseña, Google o
Apple), ver sus guiones guardados en Firestore, crear un guion nuevo
(sembrado con el guion de muestra para empezar), abrir uno en modo lectura y
borrarlo. Reemplaza la pantalla demo actual.

Esta fase es **solo web**; la UI equivalente en móvil queda para una fase
posterior según la decomposición del spec maestro de la fase de datos
(`2026-05-18-data-layer-and-auth-design.md`, sección 12).

## 2. Alcance

Incluye:
- Setup de Tailwind CSS y shadcn/ui en `apps/web`.
- Capa React de `@dialog/data` que se difirió en la fase anterior:
  `<FirebaseProvider>`, `<AuthProvider>`, `useAuth`, `useScripts`.
- Pantalla de autenticación (login, registro, reseteo, Google, Apple).
- Pantalla "Mis guiones" (lista, crear con seed, abrir, borrar, logout).
- Viewer de un guion en modo lectura.
- Configuración de Firebase para la app web (variables de entorno, conexión
  opcional a los emuladores).
- Mapper de errores de Firebase a mensajes en español.

NO incluye:
- UI equivalente en móvil (fase aparte).
- Editor de guiones (fase posterior; en esta fase los guiones se crean
  sembrados con la muestra y se abren en modo lectura).
- Importación de guiones (PDF, OCR, paste).
- Cuenta del usuario / settings / borrar cuenta.
- Tests end-to-end contra los emuladores; los tests de UI mockean
  `@dialog/data`.

## 3. Decisiones

| Tema | Decisión |
|------|----------|
| Sistema de estilos | Tailwind CSS + shadcn/ui |
| Validación de formularios | react-hook-form + zod (combo canónico de shadcn) |
| Ruteo protegido | Render condicional según `status` en una sola ruta `/`; sin middleware de cookies |
| Hooks de auth/scripts | Viven en `@dialog/data` y se exportan desde su `index.ts` |
| Conexión a Firebase | Variables `NEXT_PUBLIC_FIREBASE_*` + flag `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` para dev contra emuladores |
| Mensajes de error | Mapper de códigos Firebase → español, inline en formularios y toast para errores generales (`sonner` de shadcn) |
| Tests de UI | Mockean `@dialog/data` (sin emuladores) |

## 4. Arquitectura

### 4.1 Capa React de `@dialog/data` (nueva)

Estos módulos se difirieron en la fase anterior porque pertenecen a la
integración con React. Viven en `@dialog/data` para que la app web y, más
adelante, la app móvil consuman el mismo contrato.

```
packages/data/src/
├── react/
│   ├── FirebaseProvider.tsx   → contexto con los handles devueltos
│   │                            por `initFirebase`
│   ├── AuthProvider.tsx        → observa onAuthStateChanged y crea
│   │                             users/{uid} la primera vez
│   ├── useAuth.ts              → { user, status, signIn*, signOut, ... }
│   └── useScripts.ts           → lista en vivo (onSnapshot) + create / remove
```

`react` y `react-dom` se agregan como `peerDependencies` de `@dialog/data` (no
se duplican entre los consumidores).

### 4.2 Estructura en `apps/web`

```
apps/web/
├── tailwind.config.ts          → preset shadcn
├── postcss.config.mjs
├── app/globals.css             → @tailwind directives + tokens shadcn
├── app/layout.tsx (modif.)     → <FirebaseProvider> + <AuthProvider> + Toaster
├── app/page.tsx (modif.)       → render condicional por status
├── app/scripts/[id]/page.tsx   → viewer read-only
├── lib/firebase.ts             → wrapper de initFirebase con env vars
├── lib/firebase-errors.ts      → mapper de códigos → español
├── lib/demoScript.ts           → helper que arma el guion de muestra
│                                  (promovido de los tests al runtime)
├── components/
│   ├── auth/AuthScreen.tsx, LoginForm.tsx, RegisterForm.tsx,
│   │   ResetPasswordForm.tsx
│   ├── scripts/MyScriptsScreen.tsx, ScriptListItem.tsx, ScriptViewer.tsx
│   └── ui/ (componentes shadcn — button, input, form, card, tabs,
│       sonner, ...)
└── .env.local.example
```

`next.config.ts` se actualiza para incluir `@dialog/data` en
`transpilePackages` (ya tiene `@dialog/core`).

### 4.3 Inicialización y proveedor

El `RootLayout` lee las variables de entorno, llama a `initFirebase(config)`
en un módulo cliente al inicio (una sola vez por sesión del navegador) y pasa
los `FirebaseServices` al `<FirebaseProvider>`. `<AuthProvider>` se monta
encima y observa el estado de sesión; al detectar un usuario nuevo, crea
`users/{uid}` vía `ensureUserProfile`. Toda la UI dependiente de auth es
client-side (`'use client'`).

## 5. Componentes

1. **Capa React de `@dialog/data`** — `<FirebaseProvider>`, `<AuthProvider>`,
   `useAuth`, `useScripts`.
2. **Setup de estilos** — Tailwind + shadcn/ui en `apps/web` con un conjunto
   inicial de componentes (`button`, `input`, `label`, `form`, `card`,
   `tabs`, `sonner`).
3. **Pantalla de autenticación** — `AuthScreen` con tabs Login/Registro y
   link a Reseteo; cada uno con su propio form validado por zod; botones de
   Google y Apple.
4. **Pantalla "Mis guiones"** — header con email + logout, botón "+ Nuevo
   guion", lista en vivo, acciones por fila (abrir/borrar), banner discreto
   de "verificá tu email" si corresponde.
5. **Viewer de guion** — `ScriptViewer` renderiza título, escena y líneas;
   navegación de regreso con "Volver".
6. **Configuración Firebase + mapper de errores** —
   `lib/firebase.ts` (init + emulador opcional), `lib/firebase-errors.ts`
   (códigos → español).

## 6. Flujos

1. **Arranque** — `RootLayout` inicializa Firebase, envuelve la app con
   providers, monta el `Toaster`. `/` muestra spinner mientras `status` está
   en `loading`, luego `<AuthScreen />` o `<MyScriptsScreen />`.
2. **Registro con email** — submit → `signUpWithEmail` → `AuthProvider`
   detecta el user, crea `users/{uid}` con `ensureUserProfile`, render cambia
   a "Mis guiones". Errores SDK → inline en el form.
3. **Login con email** — submit → `signInWithEmail` → cambio de pantalla.
4. **Reseteo de contraseña** — submit → `sendPasswordReset`; éxito → toast
   "Te enviamos un email para resetear tu contraseña".
5. **Google / Apple** — botón → `signInWithGooglePopup` /
   `signInWithApplePopup` → mismo cambio de pantalla. Popup cancelado se
   ignora.
6. **Mis guiones** — `useScripts()` mantiene la lista en vivo vía
   `onSnapshot`. "+ Nuevo guion" llama a la función `create()` del hook, que
   arma el guion de muestra con el `uid` del usuario y lo guarda con
   `saveScript`. La nueva entrada aparece por la suscripción.
7. **Abrir un guion** — link a `/scripts/[id]`; la página llama a `getScript`,
   renderiza con `<ScriptViewer />`. "Volver" navega a `/`.
8. **Borrar** — confirmación con `window.confirm`; éxito → la lista se
   actualiza sola (la suscripción detecta el cambio); error → toast.
9. **Cerrar sesión** — `signOutCurrentUser` → cambia a `<AuthScreen />`.

## 7. Manejo de errores

- **Mapper `lib/firebase-errors.ts`** traduce códigos comunes:
  - `auth/email-already-in-use` → "Ya existe una cuenta con ese email."
  - `auth/invalid-credential` / `auth/wrong-password` → "Email o contraseña incorrectos."
  - `auth/weak-password` → "La contraseña es muy corta."
  - `auth/user-not-found` → "No encontramos esa cuenta."
  - `auth/too-many-requests` → "Demasiados intentos. Probá más tarde."
  - `auth/network-request-failed` → "Sin conexión. Probá de nuevo."
  - Default → "Algo salió mal." + `console.error` con el código original.
- **Errores en formularios** se muestran inline.
- **Errores generales** (red, save fallido) se muestran como toast con
  `sonner`.
- **Popup social cancelado** (`auth/popup-closed-by-user`,
  `auth/cancelled-popup-request`) → se ignora.
- **Email no verificado** no bloquea el acceso; se muestra un banner discreto
  con botón para reenviar el email.
- **Sin conexión** — la persistencia offline de Firestore deja seguir leyendo
  desde cache; los writes se encolan.

## 8. Configuración de Firebase para la web

- `apps/web/.env.local.example` (committeado) — `NEXT_PUBLIC_FIREBASE_*` con
  los valores reales del proyecto `dialog-training-actors` (no son secretas).
  El usuario copia a `.env.local` para empezar.
- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` (no committeada) activa la
  conexión a los emuladores locales en dev — útil mientras los proveedores
  Google/Apple no estén habilitados en la consola.
- `lib/firebase.ts` lee las variables, llama a `initFirebase` con la config y
  opcionalmente con `emulators: { authUrl, firestore: { host, port } }`.

## 9. Estrategia de testing

- **Vitest + Testing Library** ya configurado en `apps/web`.
- Tests de UI **mockean `@dialog/data`** (incluida la capa React) — no
  levantan emuladores:
  - `LoginForm`, `RegisterForm`, `ResetPasswordForm`: validación zod, submit
    llama al mock, errores mapeados a español, loading state.
  - `MyScriptsScreen`: la lista renderiza items del mock, "+ Nuevo guion" y
    "Borrar" llaman a las acciones, confirmación funciona.
  - `ScriptViewer`: renderiza el guion mockeado correctamente.
  - `app/page.tsx`: render condicional por `status`.
- Los hooks de `@dialog/data` (`useAuth`, `useScripts`) ya están cubiertos por
  los tests con emulador del paquete; la app web los consume y los mockea.

## 10. Decomposición en planes

La fase se implementa en **tres planes secuenciales**, cada uno entregando
software usable:

1. **Setup + capa React** — Tailwind + shadcn en `apps/web`,
   `lib/firebase.ts`, `lib/firebase-errors.ts`,
   `<FirebaseProvider>`/`<AuthProvider>`/`useAuth`/`useScripts` en
   `@dialog/data`, `next.config.ts` actualizado. La home queda con un
   placeholder de "Cargando…" cuando hay status loading y el demo actual cuando
   `signedOut` (la pantalla real de auth llega en el plan 2). Tests de los
   hooks con mocks.
2. **Pantalla de autenticación** — `AuthScreen` con tabs + reseteo +
   Google/Apple. La home cuando `signedOut` renderiza `<AuthScreen />`. Tests
   de los forms.
3. **Mis guiones + viewer** — `MyScriptsScreen`, `ScriptViewer`, ruta
   `/scripts/[id]`, banner de email no verificado. Cuando `signedIn` la home
   renderiza `<MyScriptsScreen />`. Tests de la lista y el viewer.

El primer plan se escribe a continuación; los siguientes cuando corresponda.
