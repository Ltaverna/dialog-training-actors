'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Script } from '@dialog/core';
import { useFirebase } from './FirebaseProvider';
import { useAuth } from './useAuth';
import {
  saveScript,
  deleteScript,
  type ScriptSummary,
} from '../scripts/scriptRepository';

export type ScriptsStatus = 'loading' | 'ready' | 'error';

export interface UseScriptsResult {
  scripts: ScriptSummary[];
  status: ScriptsStatus;
  error: Error | null;
  /** Guarda un guion completo (crear o reemplazar). */
  create: (script: Script) => Promise<void>;
  /** Borra un guion por id. */
  remove: (scriptId: string) => Promise<void>;
}

/**
 * Subscripción en vivo a la lista de guiones del usuario autenticado. Cuando
 * no hay sesión, devuelve una lista vacía con `status: 'ready'`.
 */
export function useScripts(): UseScriptsResult {
  const { db } = useFirebase();
  const { user } = useAuth();
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [status, setStatus] = useState<ScriptsStatus>('loading');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user === null) {
      setScripts([]);
      setStatus('ready');
      setError(null);
      return;
    }
    setStatus('loading');
    const q = query(
      collection(db, 'scripts'),
      where('ownerUid', '==', user.uid),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list: ScriptSummary[] = snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title as string,
          updatedAt: d.data().updatedAt as number,
        }));
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        setScripts(list);
        setStatus('ready');
        setError(null);
      },
      (err) => {
        setError(err);
        setStatus('error');
      },
    );
    return unsubscribe;
  }, [db, user]);

  const create = useCallback(
    async (script: Script): Promise<void> => {
      await saveScript(db, script);
    },
    [db],
  );

  const remove = useCallback(
    async (scriptId: string): Promise<void> => {
      await deleteScript(db, scriptId);
    },
    [db],
  );

  return { scripts, status, error, create, remove };
}
