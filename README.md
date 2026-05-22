# dialog-training-actors

App multiplataforma (web, iOS, Android) para que **actores memoricen y ensayen
diálogos solos**: la app pone voz a los demás personajes, hace de teleprompter,
escucha al actor por reconocimiento de voz y lo asiste con técnicas de
memorización.

## Documentación

| Documento | Para qué |
|-----------|----------|
| [`docs/ESTADO.md`](docs/ESTADO.md) | **Empezá acá.** Qué está hecho, qué sigue, cómo correrlo |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Estructura, capas, modelo de datos y decisiones |
| [`docs/FUNCIONALIDAD.md`](docs/FUNCIONALIDAD.md) | Qué hace y hará el producto |
| [`docs/GUIA-DE-USO.md`](docs/GUIA-DE-USO.md) | Setup, correr, testear, convenciones, despliegue |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | Specs de diseño aprobados por fase |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | Planes de implementación por fase |

## Estructura

- `packages/core` (`@dialog/core`) — modelo de dominio del guion, agnóstico de
  plataforma.
- `packages/data` (`@dialog/data`) — integración Firebase (auth, Firestore,
  reglas) y capa React (`AuthProvider`, `useAuth`, `useScripts`).
- `apps/web` (`@dialog/web`) — app web (Next.js 15 + Tailwind + shadcn/ui).
- `apps/mobile` (`@dialog/mobile`) — app móvil (React Native + Expo).

## Requisitos

- Node 20+, pnpm 9+
- Firebase CLI global y Java (OpenJDK) para los emuladores

Ver [`docs/GUIA-DE-USO.md`](docs/GUIA-DE-USO.md) para el setup completo.

## Comandos del monorepo

```bash
pnpm install      # instala todas las dependencias
pnpm test         # corre los tests de todos los paquetes
pnpm typecheck    # chequea tipos en todos los paquetes
pnpm build        # build de producción de las apps
```

## Correr cada app

```bash
pnpm --filter @dialog/web dev      # web en modo desarrollo → localhost:3000
pnpm --filter @dialog/mobile start # móvil con Expo (escanear QR con Expo Go)
```
