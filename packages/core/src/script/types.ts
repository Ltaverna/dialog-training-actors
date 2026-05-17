export type CharacterId = string;
export type SceneId = string;
export type LineId = string;
export type ScriptId = string;

/** Un personaje del guion. */
export interface Character {
  id: CharacterId;
  name: string;
}

/** Una escena del guion. `order` define el orden entre escenas (desde 0). */
export interface Scene {
  id: SceneId;
  title: string;
  order: number;
}

/** `dialogue`: línea hablada por un personaje. `direction`: acotación. */
export type LineType = 'dialogue' | 'direction';

/**
 * Una línea del guion. `order` define el orden dentro de su escena (desde 0).
 * `characterId` es null en las acotaciones (`type === 'direction'`).
 */
export interface Line {
  id: LineId;
  sceneId: SceneId;
  order: number;
  characterId: CharacterId | null;
  type: LineType;
  text: string;
}

/** El guion canónico. Todos los métodos de importación convergen a esta forma. */
export interface Script {
  id: ScriptId;
  title: string;
  ownerUid: string;
  characters: Character[];
  scenes: Scene[];
  lines: Line[];
}
