# Arquitectura — dialog-training-actors

> Cómo está construido el sistema: estructura, capas, flujo de datos y
> decisiones. Para el estado actual de avance ver [`ESTADO.md`](./ESTADO.md).

## 1. Principios

- **Monorepo con núcleo aislado.** La lógica de dominio vive en un paquete
  agnóstico de plataforma (`@dialog/core`) que no sabe nada de React, Firebase
  ni del navegador. Eso la hace 100% testeable con tests puros y reutilizable
  entre web, móvil y (a futuro) las Cloud Functions.
- **Una sola fuente de verdad para Firebase.** Todo el acceso al SDK de
  Firebase está encapsulado en `@dialog/data`. Las apps nunca importan
  `firebase` directamente.
- **TypeScript de punta a punta**, en modo estricto y consumido como código
  fuente entre paquetes (sin paso de build de librería).
- **TDD y revisión.** Cada cambio se construye con tests primero y pasa por
  revisión de cumplimiento de spec + calidad de código.

## 2. Estructura del monorepo

Gestionado con **pnpm workspaces** + **Turborepo**.

```
dialog-training-actors/
├── packages/
│   ├── core   (@dialog/core)   → dominio del guion, agnóstico de plataforma
│   └── data   (@dialog/data)   → integración Firebase + capa React
├── apps/
│   ├── web    (@dialog/web)    → Next.js 15 (App Router) + Tailwind + shadcn/ui
│   └── mobile (@dialog/mobile) → Expo SDK 54 / React Native
├── firebase.json / .firebaserc            → proyecto + emuladores
├── firestore.rules / firestore.indexes.json → seguridad e índices
├── tsconfig.base.json / turbo.json / pnpm-workspace.yaml
└── docs/                       → esta documentación + specs/plans
```

### Grafo de dependencias

```
@dialog/core   (sin dependencias internas)
      ▲
      │
@dialog/data   (depende de @dialog/core + firebase; React como peer dep)
      ▲
      ├──────────────┐
@dialog/web      @dialog/mobile
```

`core` no depende de nadie; `data` depende de `core`; las apps dependen de
ambos. No hay dependencias circulares. Los paquetes se consumen como fuente
TS (`exports` apunta a `./src/index.ts`); las apps los transpilan
(`transpilePackages` en Next, `watchFolders` de Metro en Expo).

## 3. Capas

### 3.1 `@dialog/core` — dominio del guion

Modelo inmutable y puro del guion teatral, sin I/O ni dependencias de
plataforma.

- **Tipos:** `Script`, `Scene`, `Character`, `Line` (con ids tipados).
- **Constructores inmutables:** `createScript`, `addScene`, `addCharacter`,
  `addLine` — devuelven `[nuevoScript, entidad]` sin mutar el original.
- **Selectores:** `getSceneLines` (líneas de una escena ordenadas).
- **Validación:** `validateScript` (integridad referencial: personajes y
  escenas que existen, acotaciones sin personaje, orden único por escena).
- **`generateId()`** encapsula `crypto.randomUUID()` con una declaración
  acotada para no atar el paquete a la lib `DOM`.

### 3.2 `@dialog/data` — Firebase + capa React

Único punto de contacto con el SDK `firebase`. Tres sub-capas:

1. **Init** — `initFirebase(config, options)` crea la app y devuelve
   `{ app, auth, db }`; conecta a los emuladores si se le pasan.
2. **Servicios y repositorios** (agnósticos de React):
   - `authService` — email/contraseña (registro, login, logout, reseteo,
     verificación, observador de estado) y social (Google/Apple, por popup en
     web y por credencial/idToken en móvil).
   - `userRepository` — `ensureUserProfile`, `getUserProfile` (`users/{uid}`).
   - `scriptRepository` — `saveScript`, `getScript`, `listScripts`,
     `deleteScript`, con el mapeo `Script` ↔ Firestore.
3. **Capa React** (en `src/react/`, consumida por las apps):
   - `<FirebaseProvider>` / `useFirebase` — provee los handles.
   - `<AuthProvider>` / `useAuth` — observa la sesión, crea el perfil en el
     primer login, expone estado (`loading`/`signedOut`/`signedIn`) y acciones.
   - `useScripts` — suscripción en vivo (`onSnapshot`) a los guiones del
     usuario, con `create`/`remove`.

### 3.3 Apps

- **`@dialog/web`** — Next.js 15 App Router. `app/providers.tsx` monta
  `ThemeProvider` + `FirebaseProvider` + `AuthProvider` + `Toaster`. La home
  (`app/page.tsx`) renderiza según el `status` de auth: cargando → pantalla de
  auth (`components/auth/`) → (próximamente) "Mis guiones". UI con Tailwind v4
  + shadcn/ui; formularios con react-hook-form + zod.
- **`@dialog/mobile`** — Expo SDK 54 / React Native. Hoy una pantalla de
  demostración; la UI real es una fase posterior.

## 4. Modelo de datos (Firestore)

```
users/{uid}                     → { displayName, email, createdAt, subscription }
scripts/{scriptId}              → { title, ownerUid, collaborators[],
                                    characters[], scenes[], createdAt, updatedAt }
scripts/{scriptId}/lines/{id}   → Line  (subcolección)
```

`characters` y `scenes` van **embebidos** en el documento del guion (son
arrays chicos); las **líneas van en subcolección** para no chocar el límite de
1 MB por documento en obras largas. El `scriptRepository` traduce entre el
`Script` en memoria de `@dialog/core` y esta forma.

### Reglas de seguridad (`firestore.rules`)

- `users/{uid}` — solo lo lee/escribe el usuario dueño de ese uid.
- `scripts/{id}` — accesible por el `ownerUid` y los uids en `collaborators`;
  `ownerUid` es inmutable; solo el dueño borra y modifica `collaborators`; al
  crear, `collaborators` debe ir vacío.
- `scripts/{id}/lines/{id}` — hereda el permiso del guion padre.

## 5. Flujos clave

**Autenticación (web):** `AuthProvider` observa `onAuthStateChanged`. Al
iniciar sesión, crea `users/{uid}` con `ensureUserProfile` y pasa a
`signedIn`; la UI reacciona vía `useAuth().status`. Google/Apple usan popup en
web; en móvil se obtiene la credencial nativa y se pasa a `signInWithCredential`.

**Guiones:** `useScripts` mantiene la lista en vivo con `onSnapshot` sobre
`scripts where ownerUid == uid`. Guardar/borrar usa el `scriptRepository`; la
suscripción refleja el cambio automáticamente.

## 6. Stack tecnológico

| Área | Tecnología |
|------|-----------|
| Lenguaje | TypeScript (estricto) |
| Monorepo | pnpm workspaces + Turborepo |
| Dominio | `@dialog/core` (TS puro) |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions a futuro) |
| Web | Next.js 15 (App Router), Tailwind v4, shadcn/ui, react-hook-form + zod |
| Móvil | Expo SDK 54 / React Native |
| Tests | Vitest; Testing Library (web + capa React); Firebase Emulator Suite; `@firebase/rules-unit-testing` |
| Voces (futuro) | TTS en la nube; STT en streaming |

## 7. Estrategia de testing

- **`@dialog/core`** — tests unitarios puros.
- **`@dialog/data`** — tests contra los **emuladores** de Auth y Firestore
  (vía `firebase emulators:exec`); la capa React se testea con jsdom + Testing
  Library; las reglas con `@firebase/rules-unit-testing`. Vitest corre con
  `fileParallelism: false` porque el emulador es compartido entre archivos.
- **`@dialog/web`** — tests de componentes con Vitest + Testing Library,
  **mockeando `@dialog/data`** (no levantan Firebase).

## 8. Decisiones y su porqué

Las decisiones de diseño están documentadas en los **specs** de cada fase, en
`docs/superpowers/specs/`. Algunas transversales:

- **Cloud Functions en TypeScript** (no Python) para reutilizar `@dialog/core`
  y mantener un solo lenguaje.
- **`@dialog/data` como única frontera con Firebase** para poder cambiar el
  backend o testear sin tocar las apps.
- **Las líneas del guion en subcolección** por el límite de tamaño de
  documento.
- **shadcn v4 (`base-nova`, `@base-ui/react`)**: el componente `form` no existe
  en ese registro, así que está hecho a mano en `apps/web/components/ui/form.tsx`.

## 9. Cómo se construye el proyecto

Cada fase sigue el ciclo **brainstorm → spec → plan → implementación**
(con subagentes y doble revisión). Specs aprobados en
`docs/superpowers/specs/`, planes de implementación en
`docs/superpowers/plans/`. El historial de planes ejecutados está en
[`ESTADO.md`](./ESTADO.md).
