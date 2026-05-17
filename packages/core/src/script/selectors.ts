import type { Line, SceneId, Script } from './types';

/**
 * Devuelve las líneas de una escena ordenadas por `order` ascendente.
 * No muta el guion: opera sobre una copia del array de líneas.
 */
export function getSceneLines(script: Script, sceneId: SceneId): Line[] {
  return script.lines
    .filter((line) => line.sceneId === sceneId)
    .sort((a, b) => a.order - b.order);
}
