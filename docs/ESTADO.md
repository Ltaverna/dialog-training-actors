# Estado del proyecto — dialog-training-actors

> Documento de continuidad. Última actualización: **2026-05-18**.
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
  Muestra una pantalla de demostración con un guion de muestra.
- **Móvil** — `pnpm --filter @dialog/mobile start`, escanear el QR con la app
  Expo Go. Muestra la misma pantalla de demostración.

Ambas pantallas son **placeholders de demostración** (renderizan un guion de
ejemplo para probar el cableado). Las pantallas reales —login, lista de
guiones, ensayo— todavía no están construidas.

## 3. Fases completadas

| Fase | Estado | Resultado |
|------|--------|-----------|
| Diseño del producto | ✅ | Spec completo del producto |
| Fase 0 — Fundación | ✅ | Monorepo + `@dialog/core` (modelo de dominio del guion) |
| Scaffolding de apps | ✅ | `apps/web` (Next.js) y `apps/mobile` (Expo) consumiendo `@dialog/core` |
| Datos + Auth (parte 1) | ✅ | `@dialog/data`: integración Firebase + servicio de autenticación |

**33 tests** verdes en el monorepo. Todo está en la rama `main` y pusheado a
GitHub (`github.com/Ltaverna/dialog-training-actors`).

## 4. Estructura del repo

```
dialog-training-actors/
├── packages/
│   ├── core   (@dialog/core)  → modelo de dominio del guion, agnóstico de plataforma
│   └── data   (@dialog/data)  → integración Firebase: initFirebase + servicio de auth
├── apps/
│   ├── web    (@dialog/web)    → app web (Next.js 15)
│   └── mobile (@dialog/mobile) → app móvil (Expo SDK 54 / React Native)
├── firebase.json, .firebaserc  → config del proyecto Firebase y emuladores
├── docs/superpowers/
│   ├── specs/  → documentos de diseño aprobados
│   └── plans/  → planes de implementación
└── docs/ESTADO.md → este archivo
```

## 5. Comandos

Requisitos: Node 20+, pnpm 9+, y el CLI de `firebase` instalado globalmente.

```bash
pnpm install      # instala todas las dependencias
pnpm test         # corre los tests de los 4 paquetes
pnpm typecheck    # chequea tipos
pnpm build        # build de producción (solo la web por ahora)

pnpm --filter @dialog/web dev       # web en desarrollo → localhost:3000
pnpm --filter @dialog/mobile start  # móvil con Expo
```

`@dialog/data:test` levanta el emulador de Auth de Firebase automáticamente.

## 6. Infraestructura Firebase

- **Proyecto:** `dialog-training-actors`
  (consola: <https://console.firebase.google.com/project/dialog-training-actors/overview>)
- **Cuenta:** se administra con la cuenta de Google `taverna.lucas@gmail.com`.
- **Web app** registrada — la config del SDK está en el plan
  `docs/superpowers/plans/2026-05-18-data-infrastructure-and-auth-service.md`.
- **Plan de Firebase:** Spark (gratuito). Cloud Functions y otras features
  necesitarán pasar a Blaze más adelante.

## 7. Próximo paso: plan de los repositorios de Firestore

El siguiente sub-proyecto (segundo plan de la fase de datos): los repositorios
de Firestore (`userRepository`, `scriptRepository`), el mapeo
`Script` ↔ Firestore y las reglas de seguridad, con tests contra el emulador
de Firestore.

**Para retomar mañana:** pedir "escribamos el plan de los repositorios de
Firestore" — se escribe el plan y se ejecuta con el mismo flujo de subagentes.

## 8. Acciones pendientes del usuario

Ninguna bloquea el trabajo inmediato, pero hay que resolverlas antes de las
fases indicadas:

- **Antes del plan de repositorios:** instalar Java (JDK 11+) — el emulador de
  Firestore lo requiere. En macOS: `brew install openjdk`. (El plan lo incluirá
  como primera tarea de todos modos.)
- **Antes de la fase de UI de autenticación:** habilitar los proveedores
  **Email/Password, Google y Apple** en la consola de Firebase → Authentication.
  Apple además necesita un Service ID y una key en la cuenta Apple Developer.
- **Para el despliegue (fase futura):** está disponible el dominio
  `neuralcore.dev` para subdominios; y ya hay licencias de Google Play y Apple
  Developer compradas.

## 9. Decisiones clave tomadas

- **Stack:** monorepo TypeScript (pnpm + Turborepo). `@dialog/core` y
  `@dialog/data` se consumen como código fuente, sin paso de build de librería.
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions). Las Cloud
  Functions se harán en **TypeScript** (no Python) para reutilizar `@dialog/core`.
- **Autenticación:** email/contraseña + Google + Apple.
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
4. Repositorios de Firestore — pendiente de escribir.
