'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { useFirebase } from './FirebaseProvider';
import {
  observeAuthState,
  signUpWithEmail as serviceSignUpWithEmail,
  signInWithEmail as serviceSignInWithEmail,
  signOutCurrentUser as serviceSignOut,
  sendPasswordReset as serviceSendPasswordReset,
  signInWithGooglePopup as serviceSignInWithGooglePopup,
  signInWithApplePopup as serviceSignInWithApplePopup,
} from '../auth/authService';
import { ensureUserProfile } from '../user/userRepository';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Observa el estado de Firebase Auth y, en el primer login, crea el perfil
 * en Firestore (`users/{uid}`). Provee el estado y las acciones al árbol via
 * `useAuth`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, db } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = observeAuthState(auth, async (firebaseUser) => {
      if (firebaseUser !== null) {
        try {
          await ensureUserProfile(db, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
          });
        } catch (e) {
          // No bloqueamos el login si la escritura del perfil falla;
          // se reintenta en el próximo login.
          console.error('[AuthProvider] ensureUserProfile falló', e);
        }
        setUser(firebaseUser);
        setStatus('signedIn');
      } else {
        setUser(null);
        setStatus('signedOut');
      }
    });
    return unsubscribe;
  }, [auth, db]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      await serviceSignUpWithEmail(auth, email, password);
    },
    [auth],
  );
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      await serviceSignInWithEmail(auth, email, password);
    },
    [auth],
  );
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    await serviceSignInWithGooglePopup(auth);
  }, [auth]);
  const signInWithApple = useCallback(async (): Promise<void> => {
    await serviceSignInWithApplePopup(auth);
  }, [auth]);
  const sendPasswordReset = useCallback(
    (email: string): Promise<void> => serviceSendPasswordReset(auth, email),
    [auth],
  );
  const signOut = useCallback(
    (): Promise<void> => serviceSignOut(auth),
    [auth],
  );

  const value: AuthContextValue = {
    user,
    status,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    sendPasswordReset,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
