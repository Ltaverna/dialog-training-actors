'use client';

import { useAuth } from '@dialog/data';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default function Home() {
  const { status, user, signOut } = useAuth();

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Hola, {user?.email}</h1>
      <p className="text-muted-foreground">
        Acá va la lista de tus guiones, próximamente.
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm underline"
      >
        Cerrar sesión
      </button>
    </main>
  );
}
