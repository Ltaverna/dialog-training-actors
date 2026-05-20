// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  createScript,
  addScene,
  addCharacter,
  addLine,
  type Script,
} from '@dialog/core';
import {
  initFirebase,
  signUpWithEmail,
  signOutCurrentUser,
  type FirebaseServices,
} from '../index';
import { FirebaseProvider } from './FirebaseProvider';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { useScripts } from './useScripts';

const DEMO_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-dialog-test.firebaseapp.com',
  projectId: 'demo-dialog-test',
  storageBucket: 'demo-dialog-test.appspot.com',
  messagingSenderId: '0',
  appId: 'demo-app-id',
};

let services: FirebaseServices;

beforeAll(() => {
  services = initFirebase(DEMO_CONFIG, {
    emulators: {
      authUrl: 'http://127.0.0.1:9099',
      firestore: { host: '127.0.0.1', port: 8080 },
    },
  });
});

function uniqueEmail(): string {
  return `user-${crypto.randomUUID()}@example.com`;
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider services={services}>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseProvider>
  );
}

function buildSampleScript(ownerUid: string): Script {
  const empty = createScript({ title: 'Mi guion', ownerUid });
  const [s1, scene] = addScene(empty, 'Acto I');
  const [s2, hamlet] = addCharacter(s1, 'Hamlet');
  const [s3] = addLine(s2, {
    sceneId: scene.id,
    characterId: hamlet.id,
    type: 'dialogue',
    text: 'Hola.',
  });
  return s3;
}

describe('useScripts', () => {
  it('arranca vacío cuando no hay sesión', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(
      () => ({ auth: useAuth(), scripts: useScripts() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.auth.status).toBe('signedOut'));
    expect(result.current.scripts.scripts).toEqual([]);
  });

  it('lista los guiones del usuario y refleja create/remove en vivo', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(
      () => ({ auth: useAuth(), scripts: useScripts() }),
      { wrapper },
    );

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });
    await waitFor(() => expect(result.current.auth.status).toBe('signedIn'));
    await waitFor(() =>
      expect(result.current.scripts.status).toBe('ready'),
    );
    expect(result.current.scripts.scripts).toEqual([]);

    const uid = result.current.auth.user?.uid as string;
    const script = buildSampleScript(uid);

    await act(async () => {
      await result.current.scripts.create(script);
    });
    await waitFor(() =>
      expect(result.current.scripts.scripts).toHaveLength(1),
    );
    const first = result.current.scripts.scripts[0];
    expect(first?.title).toBe('Mi guion');

    await act(async () => {
      await result.current.scripts.remove(script.id);
    });
    await waitFor(() =>
      expect(result.current.scripts.scripts).toHaveLength(0),
    );
  });
});
