import { describe, it, expect } from 'vitest';
import { createScript } from './createScript';
import { addCharacter, addScene } from './builders';

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
});
