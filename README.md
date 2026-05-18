# dialog-training-actors

App multiplataforma para que actores memoricen y ensayen diálogos. Ver el
diseño en `docs/superpowers/specs/`.

## Estructura

- `packages/core` (`@dialog/core`) — modelo de dominio del guion, agnóstico de
  plataforma.
- `apps/web` (`@dialog/web`) — app web (Next.js).
- `apps/mobile` (`@dialog/mobile`) — app móvil (React Native + Expo).

## Requisitos

- Node 20+
- pnpm 9+

## Comandos del monorepo

```bash
pnpm install      # instala todas las dependencias
pnpm test         # corre los tests de todos los paquetes
pnpm typecheck    # chequea tipos en todos los paquetes
pnpm build        # build de producción de las apps
```

## Correr cada app

```bash
pnpm --filter @dialog/web dev      # web en modo desarrollo
pnpm --filter @dialog/mobile start # móvil con Expo (escanear QR con Expo Go)
```
