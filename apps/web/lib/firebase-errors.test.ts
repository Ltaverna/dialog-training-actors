import { describe, it, expect } from 'vitest';
import { firebaseErrorMessage, isPopupCancelled } from './firebase-errors';

describe('firebaseErrorMessage', () => {
  it('traduce auth/email-already-in-use', () => {
    expect(firebaseErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'Ya existe una cuenta con ese email.',
    );
  });

  it('traduce auth/invalid-credential', () => {
    expect(firebaseErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Email o contraseña incorrectos.',
    );
  });

  it('traduce auth/wrong-password', () => {
    expect(firebaseErrorMessage({ code: 'auth/wrong-password' })).toBe(
      'Email o contraseña incorrectos.',
    );
  });

  it('traduce auth/weak-password', () => {
    expect(firebaseErrorMessage({ code: 'auth/weak-password' })).toBe(
      'La contraseña es muy corta.',
    );
  });

  it('traduce auth/user-not-found', () => {
    expect(firebaseErrorMessage({ code: 'auth/user-not-found' })).toBe(
      'No encontramos esa cuenta.',
    );
  });

  it('traduce auth/too-many-requests', () => {
    expect(firebaseErrorMessage({ code: 'auth/too-many-requests' })).toBe(
      'Demasiados intentos. Probá más tarde.',
    );
  });

  it('traduce auth/network-request-failed', () => {
    expect(firebaseErrorMessage({ code: 'auth/network-request-failed' })).toBe(
      'Sin conexión. Probá de nuevo.',
    );
  });

  it('usa un fallback genérico para códigos desconocidos', () => {
    expect(firebaseErrorMessage({ code: 'auth/something-weird' })).toBe(
      'Algo salió mal.',
    );
  });

  it('usa el fallback cuando el error no tiene código', () => {
    expect(firebaseErrorMessage(new Error('boom'))).toBe('Algo salió mal.');
  });
});

describe('isPopupCancelled', () => {
  it('detecta auth/popup-closed-by-user', () => {
    expect(isPopupCancelled({ code: 'auth/popup-closed-by-user' })).toBe(true);
  });

  it('detecta auth/cancelled-popup-request', () => {
    expect(isPopupCancelled({ code: 'auth/cancelled-popup-request' })).toBe(
      true,
    );
  });

  it('no detecta otros errores', () => {
    expect(isPopupCancelled({ code: 'auth/wrong-password' })).toBe(false);
    expect(isPopupCancelled(new Error('boom'))).toBe(false);
  });
});
