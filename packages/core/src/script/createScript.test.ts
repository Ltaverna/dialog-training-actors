import { describe, it, expect } from 'vitest';
import { createScript } from './createScript';

describe('createScript', () => {
  it('crea un guion vacío con el título y el dueño dados', () => {
    const script = createScript({ title: 'Hamlet', ownerUid: 'user-1' });
    expect(script.title).toBe('Hamlet');
    expect(script.ownerUid).toBe('user-1');
    expect(script.characters).toEqual([]);
    expect(script.scenes).toEqual([]);
    expect(script.lines).toEqual([]);
  });

  it('asigna un id único a cada guion', () => {
    const a = createScript({ title: 'A', ownerUid: 'u' });
    const b = createScript({ title: 'B', ownerUid: 'u' });
    expect(a.id).not.toBe(b.id);
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
