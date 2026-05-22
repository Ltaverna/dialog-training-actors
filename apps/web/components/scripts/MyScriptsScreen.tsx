'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth, useScripts } from '@dialog/data';
import { Button } from '@/components/ui/button';
import { buildStarterScript } from '@/lib/demoScript';
import { firebaseErrorMessage } from '@/lib/firebase-errors';

export function MyScriptsScreen() {
  const { user, signOut } = useAuth();
  const { scripts, status, create, remove } = useScripts();
  const [creating, setCreating] = useState(false);

  async function handleCreate(): Promise<void> {
    if (user === null) {
      return;
    }
    setCreating(true);
    try {
      await create(buildStarterScript(user.uid));
    } catch (e) {
      toast.error(firebaseErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, title: string): Promise<void> {
    if (!window.confirm(`¿Borrar "${title}"?`)) {
      return;
    }
    try {
      await remove(id);
    } catch (e) {
      toast.error(firebaseErrorMessage(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Mis guiones</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </header>

      {user !== null && !user.emailVerified && (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Verificá tu email para asegurar tu cuenta.
        </p>
      )}

      <Button onClick={() => void handleCreate()} disabled={creating}>
        {creating ? 'Creando…' : '+ Nuevo guion'}
      </Button>

      {status === 'loading' ? (
        <p className="text-muted-foreground">Cargando guiones…</p>
      ) : scripts.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no tenés guiones. Creá el primero con &quot;+ Nuevo guion&quot;.
        </p>
      ) : (
        <ul className="grid gap-2">
          {scripts.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <span className="font-medium">{s.title}</span>
              <span className="flex items-center gap-3">
                <Link href={`/scripts/${s.id}`} className="text-sm underline">
                  Abrir
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(s.id, s.title)}
                >
                  Borrar
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
