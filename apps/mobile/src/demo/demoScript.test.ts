import { describe, it, expect } from '@jest/globals';
import { validateScript, getSceneLines } from '@dialog/core';
import { buildDemoScript } from './demoScript';

describe('buildDemoScript', () => {
  it('arma un guion válido con una escena y al menos dos líneas', () => {
    const { script, scene } = buildDemoScript();

    expect(validateScript(script).valid).toBe(true);
    expect(script.scenes).toHaveLength(1);
    expect(getSceneLines(script, scene.id).length).toBeGreaterThanOrEqual(2);
  });
});
