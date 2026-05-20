'use client';

import { useState, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, FirebaseProvider } from '@dialog/data';
import { Toaster } from '@/components/ui/sonner';
import { getFirebase } from '@/lib/firebase';

export function Providers({ children }: { children: ReactNode }) {
  // useState con inicializador lazy: getFirebase() corre una sola vez por
  // sesión del navegador.
  const [services] = useState(() => getFirebase());
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseProvider services={services}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}
