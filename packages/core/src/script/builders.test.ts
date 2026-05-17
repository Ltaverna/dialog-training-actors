import { describe, it, expect } from 'vitest';
import { createScript } from './createScript';
import { addCharacter, addScene } from './builders';
import { addLine } from './builders';

describe('addCharacter', () => {
  it('agrega un personaje con id único y devuelve el personaje creado', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    const [updated, character] = addCharacter(script, 'Ofelia');

    expect(character.name).toBe('Ofelia');
    expect(character.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(updated.characters).toEqual([character]);
  });

  it('no muta el guion original', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    addCharacter(script, 'Ofelia');
    expect(script.characters).toEqual([]);
  });

  it('acumula personajes y asigna ids distintos en llamadas sucesivas', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    const [afterFirst, first] = addCharacter(script, 'Hamlet');
    const [afterSecond, second] = addCharacter(afterFirst, 'Ofelia');

    expect(first.id).not.toBe(second.id);
    expect(afterSecond.characters).toEqual([first, second]);
  });
});

describe('addScene', () => {
  it('agrega una escena con order incremental desde 0', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    const [afterFirst, first] = addScene(script, 'Acto I');
    const [afterSecond, second] = addScene(afterFirst, 'Acto II');

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(afterSecond.scenes).toEqual([first, second]);
  });

  it('no muta el guion original', () => {
    const script = createScript({ title: 'T', ownerUid: 'u' });
    addScene(script, 'Acto I');
    expect(script.scenes).toEqual([]);
  });
});

describe('addLine', () => {
  it('agrega una línea de diálogo con order incremental dentro de la escena', () => {
    let script = createScript({ title: 'T', ownerUid: 'u' });
    const [s1, scene] = addScene(script, 'Acto I');
    const [s2, character] = addCharacter(s1, 'Hamlet');

    const [s3, first] = addLine(s2, {
      sceneId: scene.id,
      characterId: character.id,
      type: 'dialogue',
      text: 'Ser o no ser.',
    });
    const [s4, second] = addLine(s3, {
      sceneId: scene.id,
      characterId: character.id,
      type: 'dialogue',
      text: 'Esa es la cuestión.',
    });

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(first.text).toBe('Ser o no ser.');
    expect(s4.lines).toEqual([first, second]);
  });

  it('numera el order de cada escena por separado', () => {
    let script = createScript({ title: 'T', ownerUid: 'u' });
    const [s1, sceneA] = addScene(script, 'Acto I');
    const [s2, sceneB] = addScene(s1, 'Acto II');

    const [s3, lineA] = addLine(s2, {
      sceneId: sceneA.id,
      characterId: null,
      type: 'direction',
      text: 'Entra el rey.',
    });
    const [, lineB] = addLine(s3, {
      sceneId: sceneB.id,
      characterId: null,
      type: 'direction',
      text: 'Sale el rey.',
    });

    expect(lineA.order).toBe(0);
    expect(lineB.order).toBe(0);
  });

  it('no muta el guion original', () => {
    const [s1, scene] = addScene(createScript({ title: 'T', ownerUid: 'u' }), 'Acto I');
    addLine(s1, { sceneId: scene.id, characterId: null, type: 'direction', text: 'x' });
    expect(s1.lines).toEqual([]);
  });
});
