'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getScript, useAuth, useFirebase } from '@dialog/data';
import type { Script } from '@dialog/core';
import { ScriptViewer } from '@/components/scripts/ScriptViewer';

type ViewState = 'loading' | 'ready' | 'notfound' | 'error';

export default function ScriptPage() {
  const params = useParams<{ id: string }>();
  const { db } = useFirebase();
  const { status } = useAuth();
  const [script, setScript] = useState<Script | null>(null);
  const [view, setView] = useState<ViewState>('loading');

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }
    let active = true;
    void getScript(db, params.id)
      .then((loaded) => {
        if (!active) {
          return;
        }
        if (loaded === null) {
          setView('notfound');
        } else {
          setScript(loaded);
          setView('ready');
        }
      })
      .catch(() => {
        if (active) {
          setView('error');
        }
      });
    return () => {
      active = false;
    };
  }, [db, params.id, status]);

  if (status === 'signedOut') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">
          Iniciá sesión para ver este guion.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <Link href="/" className="text-sm underline">
        ← Volver
      </Link>
      {view === 'loading' && (
        <p className="text-muted-foreground">Cargando guion…</p>
      )}
      {view === 'notfound' && (
        <p className="text-muted-foreground">No encontramos ese guion.</p>
      )}
      {view === 'error' && (
        <p className="text-muted-foreground">
          No pudimos cargar el guion. Intentá de nuevo.
        </p>
      )}
      {view === 'ready' && script !== null && <ScriptViewer script={script} />}
    </main>
  );
}
