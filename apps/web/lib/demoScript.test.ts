import { describe, it, expect } from 'vitest';
import { validateScript, getSceneLines } from '@dialog/core';
import { buildStarterScript } from './demoScript';

describe('buildStarterScript', () => {
  it('arma un guion válido del dueño con una escena y al menos dos líneas', () => {
    const script = buildStarterScript('owner-1');
    expect(script.ownerUid).toBe('owner-1');
    expect(validateScript(script).valid).toBe(true);
    expect(script.scenes).toHaveLength(1);
    const scene = script.scenes[0];
    if (scene === undefined) {
      throw new Error('expected a scene');
    }
    expect(getSceneLines(script, scene.id).length).toBeGreaterThanOrEqual(2);
  });

  it('asigna ids únicos a cada guion creado', () => {
    const a = buildStarterScript('owner-1');
    const b = buildStarterScript('owner-1');
    expect(a.id).not.toBe(b.id);
  });
});
