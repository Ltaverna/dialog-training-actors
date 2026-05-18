export { initFirebase } from './firebase';
export type {
  FirebaseConfig,
  FirebaseServices,
  InitFirebaseOptions,
} from './firebase';

export {
  signUpWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  sendPasswordReset,
  observeAuthState,
} from './auth/authService';
