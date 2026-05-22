import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
} from '@dialog/core';

/**
 * Arma un guion de muestra (una escena, dos personajes, dos líneas) cuyo dueño
 * es `ownerUid`. Lo usa el botón "+ Nuevo guion" para sembrar el primer guion
 * mientras todavía no existe el editor real.
 */
export function buildStarterScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Escena de práctica', ownerUid });
  const [withScene, scene] = addScene(empty, 'Acto I');
  const [withHamlet, hamlet] = addCharacter(withScene, 'Hamlet');
  const [withOfelia, ofelia] = addCharacter(withHamlet, 'Ofelia');
  const [withLine1] = addLine(withOfelia, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Ser o no ser, esa es la cuestión.',
  });
  const [withLine2] = addLine(withLine1, {
    sceneId: scene.id,
    characterId: ofelia.id,
    type: 'dialogue',
    text: 'Mi señor, ¿cómo os encontráis?',
  });
  return withLine2;
}
