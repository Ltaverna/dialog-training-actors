# Diseño — Capa de datos y autenticación

**Fecha:** 2026-05-18
**Estado:** Aprobado para pasar a planes de implementación

## 1. Contexto y objetivo

Continúa el producto descrito en
`docs/superpowers/specs/2026-05-17-actor-dialogue-practice-app-design.md`. Las
fases previas entregaron el monorepo, el paquete de dominio `@dialog/core`, y
las apps `apps/web` (Next.js 15) y `apps/mobile` (Expo SDK 54), ambas
consumiendo `@dialog/core` y mostrando un guion de muestra.

Esta fase agrega **autenticación de usuarios y persistencia de guiones en la
nube**: un paquete `@dialog/data` que integra Firebase, las reglas de seguridad
de Firestore, y la UI de autenticación en ambas apps. Al terminar, un actor
puede crear una cuenta, iniciar sesión, y ver/crear/borrar sus guiones
guardados en la nube.

El proyecto Firebase `dialog-training-actors` ya existe (creado el 2026-05-17
bajo la cuenta `taverna.lucas@gmail.com`).

## 2. Alcance

Incluye:
- El paquete `@dialog/data` (integración de Firebase Auth y Firestore).
- Reglas de seguridad de Firestore y la configuración de `firebase.json`.
- UI de autenticación en `apps/web` y `apps/mobile`.
- Persistencia de guiones: la **capa de datos (CRUD)** más una UI mínima
  (listar, crear un guion inicial, abrir en modo lectura, borrar).

NO incluye (fases posteriores del producto):
- El editor de guiones completo y los métodos de importación (PDF, OCR).
- El motor de ensayo, las voces (TTS/STT) y las ayudas de memorización.
- La monetización (el campo `subscription` se crea como placeholder).
- El ensayo en vivo (el campo `collaborators` se crea pero queda sin uso).
- Un proyecto Firebase de producción separado.

## 3. Decisiones

| Tema | Decisión |
|------|----------|
| Proveedores de login | Email/contraseña, Google y Apple (sin login anónimo) |
| Enfoque técnico | SDK JavaScript de `firebase` en web y móvil; las credenciales sociales en móvil se obtienen con módulos nativos de Expo y se pasan a `signInWithCredential` |
| Forma de `@dialog/data` | Paquete con React hooks (ambas apps son React); único lugar del repo que importa `firebase` |
| Persistencia offline | Activada en Firestore |
| Entorno | El único proyecto `dialog-training-actors` |

## 4. Arquitectura

### 4.1 El paquete `@dialog/data`

Un paquete nuevo del monorepo, `packages/data` (`@dialog/data`). Es el **único
lugar del repo que importa el SDK `firebase`**. Depende de `firebase` y de
`@dialog/core`. Expone React hooks además de funciones, porque sus dos
consumidores (`apps/web`, `apps/mobile`) son apps React.

```
packages/data/  (@dialog/data)
├── src/firebase.ts          → initFirebase(config): inicializa la app de
│                              Firebase y expone los handles de Auth y
│                              Firestore. Activa la persistencia offline.
├── src/auth/
│   ├── authService.ts       → funciones de auth: registro y login con email,
│   │                          envío de verificación, reseteo de contraseña,
│   │                          signOut, signInWithGooglePopup (web),
│   │                          signInWithGoogleCredential (móvil), ídem Apple,
│   │                          y un observador del estado de sesión.
│   ├── AuthProvider.tsx      → contexto de React con el estado de sesión.
│   └── useAuth.ts            → hook { user, status, ...acciones }.
├── src/user/userRepository.ts   → crea y lee users/{uid} (perfil).
├── src/scripts/
│   ├── scriptRepository.ts  → CRUD de guiones contra Firestore; mapea el
│   │                          Script de @dialog/core ↔ Firestore.
│   └── useScripts.ts         → hooks para la lista de guiones y un guion.
└── src/index.ts             → API pública del paquete.
```

### 4.2 Reparto web / móvil

`@dialog/data` concentra todas las llamadas a Firebase. Email/contraseña y
todo Firestore funcionan idénticos en ambas plataformas con el SDK JS.

El SDK JS de Firebase no soporta el flujo popup/redirect de Google/Apple en
React Native. Por eso lo único platform-specific —y delgado, vive en cada
app— es **obtener la credencial social**:

- **Web** — la app llama a `signInWithGooglePopup()` /
  `signInWithApplePopup()` de `@dialog/data`, que usan `signInWithPopup`.
- **Móvil** — la app obtiene el `idToken` de Google con `expo-auth-session` y
  la credencial de Apple con `expo-apple-authentication`, y los pasa a
  `signInWithGoogleCredential(idToken)` /
  `signInWithAppleCredential({ idToken, rawNonce })` de `@dialog/data`, que
  internamente llaman `signInWithCredential`.

### 4.3 Configuración de Firebase

La config web de Firebase (`apiKey`, `authDomain`, `projectId`,
`storageBucket`, `messagingSenderId`, `appId`) no es secreta —viaja en el
bundle del cliente—. Cada app la toma por variables de entorno y se la pasa a
`initFirebase(config)`:

- `apps/web` — variables `NEXT_PUBLIC_FIREBASE_*` (archivo `.env.local`).
- `apps/mobile` — variables `EXPO_PUBLIC_FIREBASE_*` (archivo `.env`).

Cada app incluye un `.env.example` con las claves esperadas. Los `.env` reales
no se commitean (ya cubiertos por `.gitignore`).

## 5. Componentes

1. **`@dialog/data`** — init de Firebase, servicio de auth, contexto/hook de
   auth, repositorio de usuario, repositorio de guiones, hooks de guiones.
2. **Reglas de seguridad de Firestore** — `firestore.rules` y
   `firestore.indexes.json` en la raíz del repo, más `firebase.json`
   (configuración de emuladores y de deploy).
3. **UI de autenticación en web** — pantallas de login/registro/reseteo,
   ruteo protegido por sesión, pantalla "mis guiones".
4. **UI de autenticación en móvil** — ídem, con cambio de pantalla según el
   estado de sesión.
5. **Aprovisionamiento de Firebase** — registrar la Web app por CLI, crear la
   base Firestore por CLI, desplegar las reglas, y habilitar los proveedores
   de Auth en la consola (acción del usuario; ver sección 9).

## 6. Modelo de datos (Firestore)

- **`users/{uid}`** — perfil del usuario:
  `{ displayName, email, createdAt, subscription }`. `subscription` arranca
  como `{ tier: 'free' }` (placeholder; la monetización es fase posterior). Se
  crea automáticamente en el primer inicio de sesión.

- **`scripts/{scriptId}`** — un guion:
  `{ title, ownerUid, collaborators[], characters[], scenes[], createdAt,
  updatedAt }`. `characters` y `scenes` son arrays chicos y van **embebidos**
  en el documento. `collaborators` es la lista de uids con acceso (la usará el
  ensayo en vivo, fase futura; por ahora siempre vacía).

- **`scripts/{scriptId}/lines/{lineId}`** — las líneas van en **subcolección**
  (pueden ser miles; así no se choca el límite de 1 MB por documento). Cada
  documento es una `Line` de `@dialog/core`.

### 6.1 Mapeo `Script` ↔ Firestore

El `Script` de `@dialog/core` tiene `characters`, `scenes` y `lines` como
arrays en memoria. El `scriptRepository` traduce en ambos sentidos:

- Al **guardar**: escribe el documento `scripts/{id}` con `characters` y
  `scenes` embebidos, y cada `Line` como documento de la subcolección `lines`,
  todo en un batch de escritura.
- Al **leer**: arma el `Script` en memoria combinando el documento y su
  subcolección `lines`.

Así `@dialog/core` permanece agnóstico de la persistencia.

## 7. Flujos de autenticación

- **Registro con email** — crea la cuenta, envía el email de verificación,
  crea `users/{uid}`, deja la sesión iniciada.
- **Login con email** — inicia sesión; si el email no está verificado, la app
  lo muestra como aviso, sin bloquear el acceso en esta fase.
- **Reseteo de contraseña** — envía el email de reseteo.
- **Google / Apple** — web por popup, móvil por flujo nativo
  (`expo-auth-session` / `expo-apple-authentication`) →
  `signInWithCredential`. En el primer login también se crea `users/{uid}`.
- **Estado de sesión** — `AuthProvider` observa los cambios de Firebase Auth y
  expone `status: 'loading' | 'signedOut' | 'signedIn'`. Mientras está
  `loading`, la app muestra una pantalla de carga.
- **Logout** — cierra la sesión.

## 8. UI de las apps (mínima y funcional)

El objetivo de la UI de esta fase es demostrar que auth y persistencia
funcionan, no entregar pantallas pulidas de producto.

- **Pantalla de autenticación** (web y móvil): login, registro y reseteo de
  contraseña con email; botones de Google y Apple.
- **Pantalla "mis guiones"**: lista los guiones del usuario desde Firestore;
  permite **crear** un guion inicial (el guion de muestra ya existente, ahora
  persistido), **abrir** uno en modo lectura (la pantalla de teleprompter de
  demostración actual) y **borrarlo**; incluye un botón de logout.
- **Ruteo protegido**: sin sesión → pantalla de autenticación; con sesión →
  "mis guiones". En web con el App Router de Next.js; en móvil por render
  condicional según `status` (sin librería de navegación todavía — se sumará
  cuando la app crezca).

El código de demostración temporal (`demoScript.ts`, las pantallas demo
actuales) se reemplaza por estas pantallas.

## 9. Aprovisionamiento de Firebase

- **Por CLI** (parte de la implementación):
  - Registrar una Web app en el proyecto (`firebase apps:create web ...`)
    para obtener la config del SDK.
  - Crear la base de datos Firestore.
  - Desplegar las reglas de seguridad
    (`firebase deploy --only firestore:rules`).
- **En la consola de Firebase** (prerequisito, acción del usuario — el CLI no
  lo cubre): habilitar los proveedores Email/Password, Google y Apple en
  Authentication. El plan de implementación documentará los pasos exactos.
  Apple además requiere configurar un Service ID y una key en la cuenta Apple
  Developer del usuario.

## 10. Manejo de errores y casos borde

- **Errores de Firebase Auth** (email ya en uso, contraseña débil,
  credenciales inválidas, red caída) — se traducen a mensajes claros en
  español en la UI.
- **Errores de Firestore** (permisos, red) — se reportan en la UI sin romper
  la app.
- **Sin conexión** — la persistencia offline de Firestore queda activada:
  leer y editar guiones funciona sin conexión y sincroniza al reconectar.
- **Email no verificado** — no bloquea el acceso en esta fase; se muestra como
  aviso.
- **Cancelación del login social** — si el usuario cancela el popup (web) o el
  flujo nativo (móvil), la app vuelve al estado anterior sin error visible.

## 11. Estrategia de testing

- **`@dialog/data`** — tests contra la **Firebase Emulator Suite** (emuladores
  de Auth y Firestore): registro y login con email, el repositorio de usuario,
  el CRUD de guiones y el mapeo `Script` ↔ Firestore.
- **Reglas de seguridad** — tests con `@firebase/rules-unit-testing` contra el
  emulador de Firestore: un usuario no puede leer ni escribir guiones de otro,
  el dueño sí, etc.
- **UI de autenticación** — tests de componentes (Vitest en web, jest-expo en
  móvil) con `@dialog/data` mockeado: render de las pantallas, validación de
  formularios, transiciones de estado.

## 12. Decomposición en planes

Esta fase es grande. Se implementará en planes separados, cada uno con su
propio ciclo spec→plan→implementación y dejando software usable:

1. **`@dialog/data` + emuladores + reglas** — el paquete, la configuración de
   Firebase, las reglas de seguridad y sus tests contra emuladores. Sin tocar
   la UI de las apps.
2. **UI de autenticación en web** — pantallas y ruteo protegido en `apps/web`,
   más la pantalla "mis guiones".
3. **UI de autenticación + guiones en móvil** — pantallas y render condicional
   en `apps/mobile`, incluido el login social nativo.

El primer plan se escribe a continuación; los siguientes cuando corresponda.
