import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  createFirestoreTestEnv,
  authedFirestore,
} from '../testing/firestoreTestEnv';
import { ensureUserProfile, getUserProfile } from './userRepository';

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

describe('ensureUserProfile', () => {
  it('crea el perfil cuando no existe', async () => {
    const db = authedFirestore(env, 'user-1');
    const profile = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    expect(profile.uid).toBe('user-1');
    expect(profile.displayName).toBe('Ofelia');
    expect(profile.email).toBe('ofelia@example.com');
    expect(profile.subscription).toEqual({ tier: 'free' });
    expect(typeof profile.createdAt).toBe('number');
  });

  it('no sobrescribe un perfil ya existente', async () => {
    const db = authedFirestore(env, 'user-1');
    const first = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    const second = await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Otro Nombre',
      email: 'otro@example.com',
    });
    expect(second).toEqual(first);
  });
});

describe('getUserProfile', () => {
  it('devuelve null para un uid inexistente', async () => {
    const db = authedFirestore(env, 'user-1');
    expect(await getUserProfile(db, 'user-1')).toBeNull();
  });

  it('devuelve el perfil después de crearlo', async () => {
    const db = authedFirestore(env, 'user-1');
    await ensureUserProfile(db, {
      uid: 'user-1',
      displayName: 'Ofelia',
      email: 'ofelia@example.com',
    });
    const profile = await getUserProfile(db, 'user-1');
    expect(profile?.email).toBe('ofelia@example.com');
  });
});
