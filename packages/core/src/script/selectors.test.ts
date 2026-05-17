import { describe, it, expect } from 'vitest';
import type { Line, Script } from './types';
import { getSceneLines } from './selectors';

function scriptWithLines(lines: Line[]): Script {
  return {
    id: 's',
    title: 'T',
    ownerUid: 'u',
    characters: [],
    scenes: [],
    lines,
  };
}

describe('getSceneLines', () => {
  it('devuelve solo las líneas de la escena pedida, ordenadas por order', () => {
    const script = scriptWithLines([
      { id: 'l3', sceneId: 'A', order: 1, characterId: null, type: 'direction', text: 'b' },
      { id: 'l1', sceneId: 'B', order: 0, characterId: null, type: 'direction', text: 'otra' },
      { id: 'l2', sceneId: 'A', order: 0, characterId: null, type: 'direction', text: 'a' },
    ]);

    const lines = getSceneLines(script, 'A');

    expect(lines.map((l) => l.id)).toEqual(['l2', 'l3']);
  });

  it('devuelve un array vacío si la escena no tiene líneas', () => {
    expect(getSceneLines(scriptWithLines([]), 'A')).toEqual([]);
  });

  it('no muta el array de líneas del guion', () => {
    const script = scriptWithLines([
      { id: 'l2', sceneId: 'A', order: 1, characterId: null, type: 'direction', text: 'b' },
      { id: 'l1', sceneId: 'A', order: 0, characterId: null, type: 'direction', text: 'a' },
    ]);
    getSceneLines(script, 'A');
    expect(script.lines.map((l) => l.id)).toEqual(['l2', 'l1']);
  });
});
