import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

/** Config del SDK web de Firebase. No es secreta: viaja en el cliente. */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  /** Opcional; presente solo si el proyecto tiene Analytics habilitado. */
  measurementId?: string;
}

/** Handles de Firebase listos para usar. */
export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/** Opciones de inicialización. Si se pasan emuladores, conecta a los locales. */
export interface InitFirebaseOptions {
  emulators?: {
    /** URL del emulador de Auth, ej. 'http://127.0.0.1:9099'. */
    authUrl?: string;
    /** Host y puerto del emulador de Firestore. */
    firestore?: { host: string; port: number };
  };
}

/**
 * Inicializa la app de Firebase y devuelve los handles de Auth y Firestore.
 * Si `options.emulators` está definido, conecta los servicios indicados a los
 * emuladores locales.
 */
export function initFirebase(
  config: FirebaseConfig,
  options: InitFirebaseOptions = {},
): FirebaseServices {
  // Reutiliza la app por defecto si ya fue inicializada (evita el error
  // 'app/duplicate-app' cuando initFirebase se llama más de una vez).
  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const emulators = options.emulators;
  if (emulators?.authUrl !== undefined) {
    connectAuthEmulator(auth, emulators.authUrl, { disableWarnings: true });
  }
  if (emulators?.firestore !== undefined) {
    connectFirestoreEmulator(
      db,
      emulators.firestore.host,
      emulators.firestore.port,
    );
  }

  return { app, auth, db };
}
