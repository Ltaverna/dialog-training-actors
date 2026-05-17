import type { Script } from './types';

export interface CreateScriptParams {
  title: string;
  ownerUid: string;
}

/** Crea un guion vacío, sin personajes, escenas ni líneas. */
export function createScript(params: CreateScriptParams): Script {
  return {
    id: crypto.randomUUID(),
    title: params.title,
    ownerUid: params.ownerUid,
    characters: [],
    scenes: [],
    lines: [],
  };
}
