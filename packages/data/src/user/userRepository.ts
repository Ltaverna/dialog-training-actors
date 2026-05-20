import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

/** Estado de suscripción del usuario (placeholder hasta la fase de monetización). */
export interface SubscriptionInfo {
  tier: 'free';
}

/** Perfil del usuario almacenado en `users/{uid}`. */
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  /** Fecha de creación en milisegundos epoch. */
  createdAt: number;
  subscription: SubscriptionInfo;
}

/** Datos mínimos del usuario autenticado necesarios para crear su perfil. */
export interface EnsureUserProfileParams {
  uid: string;
  displayName: string | null;
  email: string | null;
}

/**
 * Devuelve el perfil del usuario, creándolo en `users/{uid}` si todavía no
 * existe (primer inicio de sesión). Si ya existe, lo devuelve sin modificarlo.
 */
export async function ensureUserProfile(
  db: Firestore,
  params: EnsureUserProfileParams,
): Promise<UserProfile> {
  const ref = doc(db, 'users', params.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return snapshot.data() as UserProfile;
  }
  const profile: UserProfile = {
    uid: params.uid,
    displayName: params.displayName,
    email: params.email,
    createdAt: Date.now(),
    subscription: { tier: 'free' },
  };
  await setDoc(ref, profile);
  return profile;
}

/** Lee el perfil del usuario. Devuelve `null` si no existe. */
export async function getUserProfile(
  db: Firestore,
  uid: string,
): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}
