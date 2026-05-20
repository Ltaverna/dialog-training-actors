'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FirebaseServices } from '../firebase';

const FirebaseContext = createContext<FirebaseServices | null>(null);

/** Provee los handles de Firebase a la subtree React. */
export function FirebaseProvider({
  services,
  children,
}: {
  services: FirebaseServices;
  children: ReactNode;
}) {
  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Devuelve los handles de Firebase del contexto. Lanza si no se está
 * dentro de un `<FirebaseProvider>`.
 */
export function useFirebase(): FirebaseServices {
  const ctx = useContext(FirebaseContext);
  if (ctx === null) {
    throw new Error('useFirebase debe usarse dentro de <FirebaseProvider>');
  }
  return ctx;
}
