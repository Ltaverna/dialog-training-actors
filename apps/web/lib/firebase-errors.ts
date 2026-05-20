const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña es muy corta.',
  'auth/user-not-found': 'No encontramos esa cuenta.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
  'auth/network-request-failed': 'Sin conexión. Probá de nuevo.',
  'auth/operation-not-allowed':
    'Este método de inicio de sesión no está habilitado.',
};

const FALLBACK = 'Algo salió mal.';

function readCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Traduce un error del SDK de Firebase a un mensaje en español. Para códigos
 * desconocidos devuelve un mensaje genérico y registra el error en la consola.
 */
export function firebaseErrorMessage(error: unknown): string {
  const code = readCode(error);
  if (code !== undefined && code in MESSAGES) {
    return MESSAGES[code] as string;
  }
  console.error('[firebase] error sin traducción:', error);
  return FALLBACK;
}

/** `true` si el error indica que el usuario cerró el popup de sign-in social. */
export function isPopupCancelled(error: unknown): boolean {
  const code = readCode(error);
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  );
}
