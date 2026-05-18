import { describe, it, expect, beforeAll } from 'vitest';
import type { User } from 'firebase/auth';
import { initFirebase, type FirebaseServices } from '../firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  sendPasswordReset,
  observeAuthState,
} from './authService';

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
    emulators: { authUrl: 'http://127.0.0.1:9099' },
  });
});

function uniqueEmail(): string {
  return `actor-${crypto.randomUUID()}@example.com`;
}

describe('signUpWithEmail', () => {
  it('crea un usuario nuevo con el email sin verificar', async () => {
    const user = await signUpWithEmail(
      services.auth,
      uniqueEmail(),
      'secret123',
    );
    expect(user.email).toMatch(/@example\.com$/);
    expect(user.emailVerified).toBe(false);
  });

  it('rechaza un email ya registrado', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      signUpWithEmail(services.auth, email, 'secret123'),
    ).rejects.toThrow();
  });
});

describe('signInWithEmail', () => {
  it('inicia sesión con las credenciales correctas', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await signOutCurrentUser(services.auth);
    const user = await signInWithEmail(services.auth, email, 'secret123');
    expect(user.email).toBe(email);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      signInWithEmail(services.auth, email, 'contraseña-incorrecta'),
    ).rejects.toThrow();
  });
});

describe('signOutCurrentUser', () => {
  it('deja sin usuario actual después de cerrar sesión', async () => {
    await signUpWithEmail(services.auth, uniqueEmail(), 'secret123');
    expect(services.auth.currentUser).not.toBeNull();
    await signOutCurrentUser(services.auth);
    expect(services.auth.currentUser).toBeNull();
  });
});

describe('sendPasswordReset', () => {
  it('resuelve para un email registrado', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    await expect(
      sendPasswordReset(services.auth, email),
    ).resolves.toBeUndefined();
  });
});

describe('observeAuthState', () => {
  it('notifica el usuario actual al suscribirse', async () => {
    const email = uniqueEmail();
    await signUpWithEmail(services.auth, email, 'secret123');
    const user = await new Promise<User | null>((resolve) => {
      const unsubscribe = observeAuthState(services.auth, (u) => {
        unsubscribe();
        resolve(u);
      });
    });
    expect(user?.email).toBe(email);
  });
});
