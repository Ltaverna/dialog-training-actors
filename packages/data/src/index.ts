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
  signInWithGooglePopup,
  signInWithApplePopup,
  signInWithGoogleIdToken,
  signInWithAppleIdToken,
} from './auth/authService';
