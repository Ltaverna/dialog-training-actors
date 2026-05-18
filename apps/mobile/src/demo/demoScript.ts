// Contenido de demostración temporal. Se reemplaza al construir las pantallas
// reales (importación de guiones, ensayo). Sirve para verificar el cableado
// con `@dialog/core` de punta a punta.
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
  type Scene,
} from '@dialog/core';

export interface DemoScript {
  script: Script;
  scene: Scene;
}

/** Arma un guion de muestra con una escena, dos personajes y dos líneas. */
export function buildDemoScript(): DemoScript {
  const empty = createScript({
    title: 'Escena de práctica',
    ownerUid: 'demo',
  });
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
  return { script: withLine2, scene };
}
