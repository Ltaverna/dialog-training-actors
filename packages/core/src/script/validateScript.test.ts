import { describe, it, expect } from 'vitest';
import type { Script } from './types';
import { validateScript } from './validateScript';

function baseScript(): Script {
  return {
    id: 's',
    title: 'T',
    ownerUid: 'u',
    characters: [{ id: 'c1', name: 'Hamlet' }],
    scenes: [{ id: 'sc1', title: 'Acto I', order: 0 }],
    lines: [],
  };
}

describe('validateScript', () => {
  it('marca como válido un guion correcto', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'Hola.' },
      { id: 'l2', sceneId: 'sc1', order: 1, characterId: null, type: 'direction', text: 'Sale.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('marca como válido un guion sin líneas', () => {
    const result = validateScript(baseScript());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reporta una línea de diálogo sin personaje', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: null, type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'Una línea de diálogo debe tener un personaje asignado.' },
    ]);
  });

  it('reporta una línea de diálogo con un personaje inexistente', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'fantasma', type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'La línea referencia un personaje que no existe.' },
    ]);
  });

  it('reporta una acotación que tiene personaje asignado', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'direction', text: 'Sale.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'Una acotación no debe tener un personaje asignado.' },
    ]);
  });

  it('reporta una línea cuya escena no existe', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'inexistente', order: 0, characterId: 'c1', type: 'dialogue', text: 'Hola.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'La línea referencia una escena que no existe.' },
    ]);
  });

  it('reporta dos líneas con el mismo order dentro de una escena', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'A.' },
      { id: 'l2', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'B.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l2', message: 'Hay otra línea con el mismo order en la escena.' },
    ]);
  });

  it('no reporta error cuando dos escenas distintas usan el mismo order', () => {
    const script = baseScript();
    script.scenes = [
      { id: 'sc1', title: 'Acto I', order: 0 },
      { id: 'sc2', title: 'Acto II', order: 1 },
    ];
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: 'c1', type: 'dialogue', text: 'A.' },
      { id: 'l2', sceneId: 'sc2', order: 0, characterId: 'c1', type: 'dialogue', text: 'B.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('acumula varios errores de distintas líneas', () => {
    const script = baseScript();
    script.lines = [
      { id: 'l1', sceneId: 'sc1', order: 0, characterId: null, type: 'dialogue', text: 'A.' },
      { id: 'l2', sceneId: 'inexistente', order: 0, characterId: 'c1', type: 'dialogue', text: 'B.' },
    ];
    const result = validateScript(script);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { lineId: 'l1', message: 'Una línea de diálogo debe tener un personaje asignado.' },
      { lineId: 'l2', message: 'La línea referencia una escena que no existe.' },
    ]);
  });
});
