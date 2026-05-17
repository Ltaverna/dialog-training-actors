import type { Character, CharacterId, Line, LineType, Scene, SceneId, Script } from './types';
import { generateId } from '../ids';

/**
 * Devuelve un nuevo guion con el personaje agregado, junto con el personaje
 * creado. No muta el guion original.
 */
export function addCharacter(
  script: Script,
  name: string,
): [Script, Character] {
  const character: Character = { id: generateId(), name };
  return [
    { ...script, characters: [...script.characters, character] },
    character,
  ];
}

/**
 * Devuelve un nuevo guion con la escena agregada al final (su `order` es la
 * cantidad de escenas previas), junto con la escena creada. No muta el original.
 */
export function addScene(script: Script, title: string): [Script, Scene] {
  const scene: Scene = {
    id: generateId(),
    title,
    order: script.scenes.length,
  };
  return [{ ...script, scenes: [...script.scenes, scene] }, scene];
}

export interface AddLineParams {
  sceneId: SceneId;
  characterId: CharacterId | null;
  type: LineType;
  text: string;
}

/**
 * Devuelve un nuevo guion con la línea agregada al final de su escena (su
 * `order` es la cantidad de líneas previas en esa escena), junto con la línea
 * creada. No muta el guion original.
 */
export function addLine(script: Script, params: AddLineParams): [Script, Line] {
  const order = script.lines.filter((l) => l.sceneId === params.sceneId).length;
  const line: Line = {
    id: generateId(),
    sceneId: params.sceneId,
    order,
    characterId: params.characterId,
    type: params.type,
    text: params.text,
  };
  return [{ ...script, lines: [...script.lines, line] }, line];
}
