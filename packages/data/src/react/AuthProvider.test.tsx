// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  initFirebase,
  signUpWithEmail,
  signOutCurrentUser,
  type FirebaseServices,
} from '../index';
import { FirebaseProvider } from './FirebaseProvider';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

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

describe('AuthProvider / useAuth', () => {
  it('arranca en "loading" y pasa a "signedOut" cuando no hay sesión', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.user).toBeNull();
  });

  it('refleja "signedIn" después de registrar un usuario', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });

    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user?.email).toMatch(/@example\.com$/);
  });

  it('vuelve a "signedOut" al cerrar sesión vía la acción del hook', async () => {
    await signOutCurrentUser(services.auth);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));

    await act(async () => {
      await result.current.signOut();
    });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(result.current.user).toBeNull();
  });
});
