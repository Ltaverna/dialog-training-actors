# Estado del proyecto — dialog-training-actors

> Documento de continuidad. Última actualización: **2026-05-22**.
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
  Muestra la **pantalla de autenticación real** (login / registro /
  reseteo + botones de Google/Apple). Con sesión iniciada muestra **"Mis
  guiones"**: lista en vivo desde Firestore, botón "+ Nuevo guion" (crea un
  guion de práctica inicial), abrir cada guion en el **viewer read-only** y
  borrarlo. También el aviso de email sin verificar y "Cerrar sesión".
  - Para que el login funcione necesitás un `.env.local` (copiá
    `apps/web/.env.local.example`) y, para no depender de la consola, podés
    correr contra emuladores poniendo `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`
    y levantando `firebase emulators:start --only auth,firestore`.
- **Móvil** — `pnpm --filter @dialog/mobile start`, escanear el QR con Expo Go.
  Sigue mostrando la pantalla de demostración (la UI real de móvil es una fase
  posterior).

## 2-bis. Pendientes para la próxima sesión (2026-05-23)

> Surgieron al probar por primera vez el login real contra el proyecto Firebase
> (no emulador). El login con **Google ya quedó habilitado** en la consola
> (cuenta `taverna.lucas@gmail.com`) y **se logró entrar**. Quedaron dos temas:

1. **Verificar estilos (rápido).** Hoy la web se veía **sin formato**: la causa
   fue un `dev server` viejo/cacheado, no el código. Un server fresco sirve el
   CSS correcto (52 KB con todas las utilidades de Tailwind). Para confirmar:
   ```bash
   pnpm --filter @dialog/web dev
   ```
   abrir <http://localhost:3000> y hacer **hard refresh (Cmd+Shift+R)**. Si
   alguna vez se ve sin estilos: matar el dev server, `rm -rf apps/web/.next/cache`,
   relevantarlo y hard refresh.

2. **Arreglar Firestore "client is offline" (bloquea "Mis guiones").** En la
   consola del navegador apareció:
   `[AuthProvider] ensureUserProfile falló FirebaseError: Failed to get document because the client is offline.`
   Firestore no logra conectarse, así que la lista de guiones no carga. A hacer:
   - **Crear/confirmar la base de datos Firestore** en la consola del proyecto
     `dialog-training-actors` (Firestore Database → Crear base de datos, modo
     producción, región — p. ej. `southamerica-east1` o `nam5`).
     <https://console.firebase.google.com/project/dialog-training-actors/firestore>
   - **Desplegar reglas e índices a la nube** (hoy solo existen localmente en
     `firestore.rules` / `firestore.indexes.json`):
     ```bash
     firebase login          # con taverna.lucas@gmail.com, si hace falta
     firebase deploy --only firestore:rules,firestore:indexes
     ```
   - Reintentar: login con Google → debería crear `users/{uid}` sin el error
     "offline".

3. **Probar el flujo completo end-to-end** (proyecto real, no emulador): login
   Google → "+ Nuevo guion" → abrir en el viewer → borrar. Confirmar que la
   lista carga en vivo.

4. **(Postergable) Apple Sign-In.** Requiere un Service ID + key privada en la
   cuenta Apple Developer y cargarlos en Firebase. Recomendación: dejarlo para
   más adelante; validar todo con Google primero.

5. **Elegir la próxima fase de producto** (ver sección 7): editor de guiones
   web / UI en móvil / motor de ensayo + TTS.

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
| UI "Mis guiones" + viewer (plan 3 de 3) | ✅ | Lista en vivo (crear/abrir/borrar) + viewer read-only; home cableada por status |

**104 tests** verdes en el monorepo (22 core + 35 data + 45 web + 2 mobile).
Todo está en `main` y pusheado a GitHub
(`github.com/Ltaverna/dialog-training-actors`).

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

## 7. Próximo paso

La **UI web de auth + guiones está completa** (las 3 fases del spec
`2026-05-20-web-auth-ui-design.md`). Los candidatos para la próxima fase, a
elegir cuando se retome:

- **Editor de guiones (web):** crear/editar escenas, personajes y líneas (hoy
  solo se ve el guion de práctica inicial y el viewer es read-only). Es lo que
  desbloquea cargar guiones reales.
- **UI de auth + guiones en móvil:** replicar login + "Mis guiones" + viewer en
  `apps/mobile` (hoy sigue en la pantalla de demostración).
- **Motor de ensayo / TTS:** empezar con la mecánica central del producto
  (teleprompter + voces). Requiere Cloud Functions (pasar Firebase a Blaze) y
  las API keys de TTS/STT.

**Para retomar:** elegir una de las tres y arrancar el ciclo
brainstorm → spec → plan → subagentes.

## 8. Acciones pendientes del usuario

- **Login real (no emulador):** **Google ya habilitado** (2026-05-22) y el
  login funciona. Falta habilitar **Apple** (Service ID + key en Apple
  Developer) — postergado. **Email/Password**: habilitar si se quiere usar.
  Pendiente de fondo: crear la base Firestore y desplegar reglas (ver
  sección 2-bis).
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
7. `2026-05-21-web-my-scripts-and-viewer.md` — ✅
