import type { Character, Scene, Script } from './types';
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
