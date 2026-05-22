# Estado del proyecto — dialog-training-actors

> Documento de continuidad. Última actualización: **2026-05-21**.
> Resume qué está hecho, cómo correrlo y qué sigue. Para retomar el trabajo,
> leer este archivo primero.

## 1. Qué es

App multiplataforma (iOS, Android, web) para que actores **memoricen y
ensayen diálogos solos**: la app pone voz a los demás personajes, hace de
teleprompter, escucha al actor por reconocimiento de voz y lo asiste con
técnicas de memorización. Fase final: ensayo en vivo compartido.

Diseño completo del producto: `docs/superpowers/specs/2026-05-17-actor-dialogue-practice-app-design.md`.

## 2. ¿Hay algo desplegado? — NO todavía

**Nada está publicado en internet.** No hay hosting, ni dominio apuntando, ni
apps en las tiendas. El despliegue es una fase posterior.

Lo que SÍ se puede ver, **corriendo localmente**:

- **Web** — `pnpm --filter @dialog/web dev` y abrir <http://localhost:3000>.
  Ahora muestra la **pantalla de autenticación real** (login / registro /
  reseteo + botones de Google/Apple). Con sesión iniciada muestra un saludo
  placeholder ("Hola, {email}") — la lista de guiones llega en el próximo plan.
  - Para que el login funcione necesitás un `.env.local` (copiá
    `apps/web/.env.local.example`) y, para no depender de la consola, podés
    correr contra emuladores poniendo `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
    y levantando `firebase emulators:start --only auth,firestore`.
- **Móvil** — `pnpm --filter @dialog/mobile start`, escanear el QR con Expo Go.
  Sigue mostrando la pantalla de demostración (la UI real de móvil es una fase
  posterior).

## 3. Fases completadas

| Fase | Estado | Resultado |
|------|--------|-----------|
| Diseño del producto | ✅ | Spec completo del producto |
| Fase 0 — Fundación | ✅ | Monorepo + `@dialog/core` (modelo de dominio del guion) |
| Scaffolding de apps | ✅ | `apps/web` (Next.js) y `apps/mobile` (Expo) consumiendo `@dialog/core` |
| Datos + Auth (servicio) | ✅ | `@dialog/data`: integración Firebase + servicio de autenticación |
| Repositorios Firestore + reglas | ✅ | `userRepository`, `scriptRepository`, reglas de seguridad, tests contra emuladores |
| Setup web (estilos + capa React) | ✅ | Tailwind + shadcn/ui; `FirebaseProvider`/`AuthProvider`/`useAuth`/`useScripts` |
| UI de auth web (plan 2 de 3) | ✅ | Pantalla de login/registro/reseteo + Google/Apple |

**89 tests** verdes en el monorepo. Todo está en `main` y pusheado a
GitHub (`github.com/Ltaverna/dialog-training-actors`).

## 4. Estructura del repo

```
dialog-training-actors/
├── packages/
│   ├── core   (@dialog/core)  → modelo de dominio del guion, agnóstico de plataforma
│   └── data   (@dialog/data)  → Firebase: initFirebase, auth, repositorios Firestore,
│                                 y capa React (FirebaseProvider/AuthProvider/useAuth/useScripts)
├── apps/
│   ├── web    (@dialog/web)    → app web (Next.js 15 + Tailwind + shadcn/ui)
│   │                             pantalla de auth en components/auth/
│   └── mobile (@dialog/mobile) → app móvil (Expo SDK 54 / React Native)
├── firebase.json, .firebaserc        → config del proyecto Firebase y emuladores
├── firestore.rules, firestore.indexes.json → reglas de seguridad
├── docs/superpowers/
│   ├── specs/  → documentos de diseño aprobados
│   └── plans/  → planes de implementación
└── docs/ESTADO.md → este archivo
```

## 5. Comandos

Requisitos: Node 20+, pnpm 9+, `firebase` CLI global, y **Java** (OpenJDK,
para el emulador de Firestore — ya instalado en esta máquina).

```bash
pnpm install      # instala todas las dependencias
pnpm test         # corre los tests de los 4 paquetes (levanta emuladores para @dialog/data)
pnpm typecheck    # chequea tipos
pnpm build        # build de producción (solo la web por ahora)

pnpm --filter @dialog/web dev       # web en desarrollo → localhost:3000
pnpm --filter @dialog/mobile start  # móvil con Expo
```

`@dialog/data:test` levanta los emuladores de Auth + Firestore automáticamente.

## 6. Infraestructura Firebase

- **Proyecto:** `dialog-training-actors`
  (consola: <https://console.firebase.google.com/project/dialog-training-actors/overview>)
- **Cuenta:** se administra con la cuenta de Google `taverna.lucas@gmail.com`.
- **Web app** registrada — la config del SDK está en
  `apps/web/.env.local.example` (no es secreta).
- **Firestore:** reglas de seguridad en `firestore.rules` (aislamiento por
  usuario; el dueño y los `collaborators` acceden a sus guiones).
- **Plan de Firebase:** Spark (gratuito). Cloud Functions y otras features
  necesitarán pasar a Blaze más adelante.

## 7. Próximo paso: plan 3 de la UI web (Mis guiones + viewer)

El siguiente sub-proyecto: la pantalla **"Mis guiones"** (lista en vivo desde
Firestore con `useScripts`, crear/abrir/borrar) y el **viewer read-only** de un
guion, que se mostrarán cuando `status === 'signedIn'` reemplazando el saludo
placeholder de la home.

**Para retomar:** pedir "escribamos el plan 3 de la UI web" — se escribe el
plan (el spec ya está en `docs/superpowers/specs/2026-05-20-web-auth-ui-design.md`)
y se ejecuta con el flujo de subagentes.

Después de eso: la UI de auth + guiones en **móvil**.

## 8. Acciones pendientes del usuario

- **Antes de probar el login REAL (no emulador):** habilitar los proveedores
  **Email/Password, Google y Apple** en la consola de Firebase →
  Authentication. Apple además necesita un Service ID y una key en la cuenta
  Apple Developer. (Mientras tanto, dev/test funciona contra emuladores.)
- **Para el despliegue (fase futura):** está disponible el dominio
  `neuralcore.dev` para subdominios; y ya hay licencias de Google Play y Apple
  Developer compradas.

## 9. Decisiones clave tomadas

- **Stack:** monorepo TypeScript (pnpm + Turborepo). `@dialog/core` y
  `@dialog/data` se consumen como código fuente, sin paso de build de librería.
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions). Las Cloud
  Functions se harán en **TypeScript** (no Python) para reutilizar `@dialog/core`.
- **Autenticación:** email/contraseña + Google + Apple.
- **Web:** Tailwind v4 + shadcn/ui (estilo `base-nova`, usa `@base-ui/react`).
  Formularios con react-hook-form + zod. El componente `form` de shadcn está
  hecho a mano (no existe en el registro v4).
- **Tests con emuladores:** `packages/data` usa `fileParallelism: false` en
  vitest porque el emulador de Firestore es compartido entre archivos de test.
- **Voces:** TTS en la nube de alta calidad. Reconocimiento de voz: STT en
  streaming en la nube.
- **Monetización:** freemium + suscripción.
- **El producto todavía no tiene nombre definitivo** ("Dialog" es nombre de
  trabajo).

## 10. Historial de planes

Cada fase tiene su spec y su plan en `docs/superpowers/`. Los planes ejecutados:

1. `2026-05-17-foundation-monorepo-and-script-domain-model.md` — ✅
2. `2026-05-17-app-scaffolding-mobile-and-web.md` — ✅
3. `2026-05-18-data-infrastructure-and-auth-service.md` — ✅
4. `2026-05-18-firestore-repositories-and-rules.md` — ✅
5. `2026-05-20-web-react-layer-and-styling-setup.md` — ✅
6. `2026-05-21-web-auth-screen.md` — ✅
7. UI web "Mis guiones" + viewer (plan 3) — pendiente de escribir.
