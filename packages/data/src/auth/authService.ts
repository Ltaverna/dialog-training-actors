import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';

/**
 * Registra un usuario nuevo con email y contraseña, y le envía el email de
 * verificación. La sesión queda iniciada. Devuelve el usuario creado.
 */
export async function signUpWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await sendEmailVerification(credential.user);
  return credential.user;
}

/** Inicia sesión con email y contraseña. Devuelve el usuario. */
export async function signInWithEmail(
  auth: Auth,
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Cierra la sesión actual. */
export function signOutCurrentUser(auth: Auth): Promise<void> {
  return signOut(auth);
}

/** Envía el email de reseteo de contraseña a la dirección dada. */
export function sendPasswordReset(auth: Auth, email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Observa los cambios del estado de sesión. El callback recibe el usuario
 * actual o `null`. Devuelve una función para desuscribirse.
 */
export function observeAuthState(
  auth: Auth,
  callback: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
