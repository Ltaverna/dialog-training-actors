import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  createFirestoreTestEnv,
  authedFirestore,
  unauthedFirestore,
} from './testing/firestoreTestEnv';

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

describe('reglas de users/{uid}', () => {
  it('el dueño puede leer y escribir su propio perfil', async () => {
    const db = authedFirestore(env, 'user-1');
    await assertSucceeds(setDoc(doc(db, 'users', 'user-1'), { uid: 'user-1' }));
    await assertSucceeds(getDoc(doc(db, 'users', 'user-1')));
  });

  it('un usuario no puede escribir el perfil de otro', async () => {
    const db = authedFirestore(env, 'user-1');
    await assertFails(setDoc(doc(db, 'users', 'user-2'), { uid: 'user-2' }));
  });

  it('un usuario no puede leer el perfil de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'user-2'), { uid: 'user-2' });
    });
    const db = authedFirestore(env, 'user-1');
    await assertFails(getDoc(doc(db, 'users', 'user-2')));
  });

  it('un request sin autenticar es rechazado', async () => {
    const db = unauthedFirestore(env);
    await assertFails(getDoc(doc(db, 'users', 'user-1')));
  });
});

describe('reglas de scripts/{scriptId}', () => {
  it('el dueño puede crear un guion con su propio ownerUid', async () => {
    const db = authedFirestore(env, 'owner-1');
    await assertSucceeds(
      setDoc(doc(db, 'scripts', 's1'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      }),
    );
  });

  it('un usuario no puede crear un guion con el ownerUid de otro', async () => {
    const db = authedFirestore(env, 'intruso');
    await assertFails(
      setDoc(doc(db, 'scripts', 's2'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      }),
    );
  });

  it('un usuario no puede crear un guion agregando a otro como collaborator', async () => {
    const db = authedFirestore(env, 'owner-1');
    await assertFails(
      setDoc(doc(db, 'scripts', 's2b'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: ['victima'],
      }),
    );
  });

  it('un usuario no puede leer el guion de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's3'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = authedFirestore(env, 'intruso');
    await assertFails(getDoc(doc(db, 'scripts', 's3')));
  });

  it('el dueño puede leer su propio guion', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's4'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = authedFirestore(env, 'owner-1');
    await assertSucceeds(getDoc(doc(db, 'scripts', 's4')));
  });
});

describe('reglas de scripts/{scriptId}/lines/{lineId}', () => {
  it('el dueño del guion puede escribir y leer sus líneas', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's5'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = authedFirestore(env, 'owner-1');
    await assertSucceeds(
      setDoc(doc(db, 'scripts', 's5', 'lines', 'l1'), { text: 'hola' }),
    );
    await assertSucceeds(getDoc(doc(db, 'scripts', 's5', 'lines', 'l1')));
  });

  it('un usuario no puede escribir líneas en el guion de otro', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'scripts', 's6'), {
        title: 'T',
        ownerUid: 'owner-1',
        collaborators: [],
      });
    });
    const db = authedFirestore(env, 'intruso');
    await assertFails(
      setDoc(doc(db, 'scripts', 's6', 'lines', 'l1'), { text: 'hola' }),
    );
  });
});
