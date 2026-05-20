import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { createFirestoreTestEnv } from './firestoreTestEnv';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createFirestoreTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

describe('createFirestoreTestEnv', () => {
  it('permite leer y escribir Firestore con las reglas deshabilitadas', async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'pruebas', 'd1'), { ok: true });
      const snap = await getDoc(doc(db, 'pruebas', 'd1'));
      expect(snap.exists()).toBe(true);
      expect(snap.data()).toEqual({ ok: true });
    });
  });
});
