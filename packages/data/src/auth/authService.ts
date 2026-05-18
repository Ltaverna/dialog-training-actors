import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
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

/** Web: inicia sesión con Google mediante un popup. Devuelve el usuario. */
export async function signInWithGooglePopup(auth: Auth): Promise<User> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

/** Web: inicia sesión con Apple mediante un popup. Devuelve el usuario. */
export async function signInWithApplePopup(auth: Auth): Promise<User> {
  const result = await signInWithPopup(auth, new OAuthProvider('apple.com'));
  return result.user;
}

/**
 * Móvil: inicia sesión con un `idToken` de Google obtenido por el flujo
 * nativo de la app (ej. `expo-auth-session`). Devuelve el usuario.
 */
export async function signInWithGoogleIdToken(
  auth: Auth,
  idToken: string,
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/**
 * Móvil: inicia sesión con la credencial de Apple obtenida por el flujo
 * nativo de la app (ej. `expo-apple-authentication`). `rawNonce` es el nonce
 * sin hashear usado al pedir la credencial. Devuelve el usuario.
 */
export async function signInWithAppleIdToken(
  auth: Auth,
  params: { idToken: string; rawNonce: string },
): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: params.idToken,
    rawNonce: params.rawNonce,
  });
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
