'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Devuelve el estado y las acciones de autenticación. Lanza si se usa fuera
 * de un `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
