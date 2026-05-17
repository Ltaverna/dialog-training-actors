import type { Line, SceneId, Script } from './types';

/**
 * Devuelve las líneas de una escena ordenadas por `order` ascendente.
 * No muta `script.lines`: `.filter()` produce un nuevo array y `.sort()` opera
 * sobre él. Los elementos `Line` devueltos comparten identidad con los del
 * guion; tratalos como solo-lectura.
 */
export function getSceneLines(script: Script, sceneId: SceneId): Line[] {
  return script.lines
    .filter((line) => line.sceneId === sceneId)
    .sort((a, b) => a.order - b.order);
}
