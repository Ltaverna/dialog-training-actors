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

export { ensureUserProfile, getUserProfile } from './user/userRepository';
export type {
  UserProfile,
  SubscriptionInfo,
  EnsureUserProfileParams,
} from './user/userRepository';

export {
  saveScript,
  getScript,
  listScripts,
  deleteScript,
} from './scripts/scriptRepository';
export type { ScriptSummary } from './scripts/scriptRepository';

export { FirebaseProvider, useFirebase } from './react/FirebaseProvider';
