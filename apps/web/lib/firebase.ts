'use client';

import { initFirebase, type FirebaseServices } from '@dialog/data';

let cached: FirebaseServices | undefined;

/**
 * Devuelve los handles de Firebase de la app, inicializándolos la primera
 * vez. Lee la config de `NEXT_PUBLIC_FIREBASE_*` y, si
 * `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, conecta a los emuladores locales.
 */
export function getFirebase(): FirebaseServices {
  if (cached !== undefined) {
    return cached;
  }

  const config = {
    apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  };

  const useEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

  cached = initFirebase(
    config,
    useEmulators
      ? {
          emulators: {
            authUrl: 'http://127.0.0.1:9099',
            firestore: { host: '127.0.0.1', port: 8080 },
          },
        }
      : {},
  );
  return cached;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}
