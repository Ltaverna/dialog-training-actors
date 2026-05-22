# Guía de uso (desarrollo) — dialog-training-actors

> Cómo levantar, desarrollar, testear y (a futuro) desplegar el proyecto.
> Arquitectura en [`ARQUITECTURA.md`](./ARQUITECTURA.md); estado en
> [`ESTADO.md`](./ESTADO.md).

## 1. Requisitos

- **Node 20+**
- **pnpm 9+** (`npm i -g pnpm` o `corepack enable`)
- **Firebase CLI** global (`npm i -g firebase-tools`) — para los emuladores
- **Java (OpenJDK 11+)** — lo necesita el emulador de Firestore.
  En macOS: `brew install openjdk && brew link --force openjdk`, después
  verificá con `java -version`.

## 2. Setup inicial

```bash
git clone git@github.com:Ltaverna/dialog-training-actors.git
cd dialog-training-actors
pnpm install
```

### Variables de entorno de la web

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

El `.env.local.example` ya trae la config real del proyecto Firebase (no es
secreta). Para desarrollar **contra los emuladores** (sin tocar el proyecto
real ni necesitar los proveedores sociales habilitados en consola), agregá:

```bash
# en apps/web/.env.local
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

## 3. Correr las apps

```bash
# Web → http://localhost:3000
pnpm --filter @dialog/web dev

# Móvil → escaneá el QR con la app Expo Go
pnpm --filter @dialog/mobile start
```

Si activaste los emuladores, levantalos en otra terminal:

```bash
firebase emulators:start --only auth,firestore
```

## 4. Comandos del monorepo

```bash
pnpm test         # tests de los 4 paquetes (Turborepo)
pnpm typecheck    # chequeo de tipos
pnpm build        # build de producción (hoy solo la web tiene build)
```

Por paquete: `pnpm --filter <nombre> <script>`, p. ej.
`pnpm --filter @dialog/core test`.

> **Nota:** `pnpm --filter @dialog/data test` levanta automáticamente los
> emuladores de Auth + Firestore alrededor de Vitest (necesita Java).

## 5. Estructura para orientarse

- `packages/core` — modelo del guion (tipos, builders, validación). Empezá acá
  para entender el dominio.
- `packages/data` — Firebase: `initFirebase`, `authService`, repositorios
  (`userRepository`, `scriptRepository`) y la capa React (`AuthProvider`,
  `useAuth`, `useScripts`).
- `apps/web` — Next.js. Auth UI en `components/auth/`, primitivos shadcn en
  `components/ui/`, helpers en `lib/`.
- `apps/mobile` — Expo.
- `docs/superpowers/specs` y `.../plans` — diseño e implementación de cada fase.

## 6. Convenciones de trabajo

El proyecto se construye fase por fase con el ciclo
**brainstorm → spec → plan → implementación**:

1. Se acuerda el diseño y se escribe un **spec** en `docs/superpowers/specs/`.
2. Se escribe un **plan** de implementación (tareas chicas, TDD) en
   `docs/superpowers/plans/`.
3. Se ejecuta el plan con subagentes y **doble revisión** (cumplimiento de spec
   + calidad de código) por tarea, en una rama `feature/...`.
4. Se mergea a `main` con todos los tests verdes.

Reglas prácticas:
- **TDD:** test que falla → implementación mínima → test verde → commit.
- **Commits chicos** y descriptivos; nunca mergear con tests rojos.
- Para retomar el trabajo, leé [`ESTADO.md`](./ESTADO.md) primero.

## 7. Tareas comunes

- **Agregar un componente shadcn:** `cd apps/web && npx shadcn@latest add <nombre>`.
- **Cambiar las reglas de Firestore:** editá `firestore.rules` y corré los tests
  de reglas (`pnpm --filter @dialog/data test`); para desplegarlas
  `firebase deploy --only firestore:rules`.
- **Inspeccionar datos de los emuladores:** mientras corren, la UI del emulador
  (si la habilitás en `firebase.json`) o la consola.

## 8. Despliegue (fase futura)

Todavía **nada está desplegado**. Cuando llegue esa fase:
- La web puede ir a Firebase Hosting (o Vercel) bajo un subdominio de
  `neuralcore.dev`.
- El móvil se publica con EAS Build a App Store / Google Play (licencias de
  desarrollador ya compradas).
- Hay que pasar el proyecto Firebase de Spark a **Blaze** para Cloud Functions.

## 9. Acciones pendientes del usuario

- **Para probar login real (no emulador):** habilitar Email/Password, Google y
  Apple en la consola de Firebase → Authentication (Apple además requiere un
  Service ID en la cuenta Apple Developer).
