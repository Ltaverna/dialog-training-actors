import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { collection, getDocs } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  validateScript,
  type Script,
} from '@dialog/core';
import {
  createFirestoreTestEnv,
  authedFirestore,
} from '../testing/firestoreTestEnv';
import {
  saveScript,
  getScript,
  listScripts,
  deleteScript,
} from './scriptRepository';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

/** Arma un guion de muestra con 1 escena, 2 personajes y 2 líneas. */
function buildSampleScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Escena de práctica', ownerUid });
  const [s1, scene] = addScene(empty, 'Acto I');
  const [s2, hamlet] = addCharacter(s1, 'Hamlet');
  const [s3, ofelia] = addCharacter(s2, 'Ofelia');
  const [s4] = addLine(s3, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Ser o no ser.',
  });
  const [s5] = addLine(s4, {
    sceneId: scene.id,
    characterId: ofelia.id,
    type: 'dialogue',
    text: '¿Cómo os encontráis?',
  });
  return s5;
}

const byId = (a: { id: string }, b: { id: string }): number =>
  a.id.localeCompare(b.id);

describe('saveScript / getScript', () => {
  it('guarda un guion y lo recupera completo', async () => {
    const db = authedFirestore(env, 'owner-1');
    const script = buildSampleScript('owner-1');

    await saveScript(db, script);
    const loaded = await getScript(db, script.id);

    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(script.id);
    expect(loaded?.title).toBe(script.title);
    expect(loaded?.ownerUid).toBe('owner-1');
    expect(loaded?.characters).toEqual(script.characters);
    expect(loaded?.scenes).toEqual(script.scenes);
    expect([...(loaded?.lines ?? [])].sort(byId)).toEqual(
      [...script.lines].sort(byId),
    );
    expect(validateScript(loaded as Script).valid).toBe(true);
  });

  it('devuelve null para un guion inexistente', async () => {
    const db = authedFirestore(env, 'owner-1');
    expect(await getScript(db, 'no-existe')).toBeNull();
  });

  it('reemplaza las líneas al volver a guardar el mismo guion', async () => {
    const db = authedFirestore(env, 'owner-1');
    const script = buildSampleScript('owner-1');
    await saveScript(db, script);

    // Guardar de nuevo con una sola línea.
    const firstLine = script.lines[0];
    if (firstLine === undefined) throw new Error('expected at least one line');
    const trimmed: Script = { ...script, lines: [firstLine] };
    await saveScript(db, trimmed);

    const loaded = await getScript(db, script.id);
    expect(loaded?.lines).toHaveLength(1);
  });
});

describe('listScripts', () => {
  it('devuelve los guiones del dueño, sin los de otros usuarios y ordenados por updatedAt desc', async () => {
    const dbOwner = authedFirestore(env, 'owner-1');
    await saveScript(dbOwner, buildSampleScript('owner-1'));
    // Pausa para que el segundo guion tenga un `updatedAt` mayor.
    await new Promise((r) => setTimeout(r, 5));
    await saveScript(dbOwner, buildSampleScript('owner-1'));

    const dbOther = authedFirestore(env, 'owner-2');
    await saveScript(dbOther, buildSampleScript('owner-2'));

    const summaries = await listScripts(dbOwner, 'owner-1');
    expect(summaries).toHaveLength(2);
    for (const s of summaries) {
      expect(s.title).toBe('Escena de práctica');
      expect(typeof s.updatedAt).toBe('number');
    }
    // El más reciente primero.
    const first = summaries[0];
    const second = summaries[1];
    if (first === undefined || second === undefined) {
      throw new Error('expected exactly two summaries');
    }
    expect(first.updatedAt).toBeGreaterThanOrEqual(second.updatedAt);
  });
});

describe('deleteScript', () => {
  it('borra el guion y todas sus líneas', async () => {
    const db = authedFirestore(env, 'owner-1');
    const script = buildSampleScript('owner-1');
    await saveScript(db, script);

    await deleteScript(db, script.id);

    expect(await getScript(db, script.id)).toBeNull();

    // Verificación directa: la subcolección de líneas queda vacía (no orfana).
    await env.withSecurityRulesDisabled(async (ctx) => {
      const linesSnap = await getDocs(
        collection(ctx.firestore(), 'scripts', script.id, 'lines'),
      );
      expect(linesSnap.empty).toBe(true);
    });
  });
});
