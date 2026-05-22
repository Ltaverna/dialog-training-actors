'use client';

import { useAuth } from '@dialog/data';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { MyScriptsScreen } from '@/components/scripts/MyScriptsScreen';

export default function Home() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (status === 'signedOut') {
    return <AuthScreen />;
  }

  return <MyScriptsScreen />;
}
