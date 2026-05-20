import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Character, Line, Scene, Script } from '@dialog/core';

/** Resumen de un guion para listados (sin las líneas). */
export interface ScriptSummary {
  id: string;
  title: string;
  /** Última modificación en milisegundos epoch. */
  updatedAt: number;
}

/**
 * Guarda un guion en Firestore: el documento `scripts/{id}` (con `characters`
 * y `scenes` embebidos) y cada línea en la subcolección `lines`. Reemplaza por
 * completo las líneas previas. `createdAt` se preserva si el guion ya existía.
 * No es atómico: escribe el documento y luego las líneas en un batch aparte
 * (necesario para que las reglas de las líneas vean el documento padre).
 *
 * Nota: usa un único batch para las líneas (máximo 500 operaciones por batch
 * en Firestore). Como el reemplazo combina deletes + sets, el techo real es
 * ~250 líneas por guion. Guiones más grandes requerirán dividir el batch
 * (mejora futura).
 *
 * No es seguro para escrituras concurrentes: dos llamadas simultáneas sobre el
 * mismo guion pueden pisarse (la lectura de `createdAt` / `collaborators` no
 * está en transacción). En v1 se asume un único cliente activo por guion.
 */
export async function saveScript(db: Firestore, script: Script): Promise<void> {
  const scriptRef = doc(db, 'scripts', script.id);
  const existing = await getDoc(scriptRef);
  const now = Date.now();
  // Preservamos `createdAt` y `collaborators` del documento existente para no
  // pisar metadata gestionada por otros flujos (ej. invitar colaboradores).
  const createdAt = existing.exists()
    ? (existing.data().createdAt as number)
    : now;
  const collaborators: string[] = existing.exists()
    ? (existing.data().collaborators as string[])
    : [];

  await setDoc(scriptRef, {
    title: script.title,
    ownerUid: script.ownerUid,
    collaborators,
    characters: script.characters,
    scenes: script.scenes,
    createdAt,
    updatedAt: now,
  });

  const linesCol = collection(scriptRef, 'lines');
  const existingLines = await getDocs(linesCol);
  const batch = writeBatch(db);
  for (const lineDoc of existingLines.docs) {
    batch.delete(lineDoc.ref);
  }
  for (const line of script.lines) {
    batch.set(doc(linesCol, line.id), line);
  }
  await batch.commit();
}

/**
 * Lee un guion completo (documento + subcolección de líneas) y lo reconstruye
 * como `Script` de `@dialog/core`. Devuelve `null` si no existe.
 */
export async function getScript(
  db: Firestore,
  scriptId: string,
): Promise<Script | null> {
  const scriptRef = doc(db, 'scripts', scriptId);
  const snap = await getDoc(scriptRef);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data();
  const linesSnap = await getDocs(collection(scriptRef, 'lines'));
  return {
    id: scriptId,
    title: data.title as string,
    ownerUid: data.ownerUid as string,
    characters: data.characters as Character[],
    scenes: data.scenes as Scene[],
    lines: linesSnap.docs.map((d) => d.data() as Line),
  };
}

/**
 * Lista los guiones de un usuario como resúmenes, ordenados por `updatedAt`
 * descendente (el más reciente primero).
 */
export async function listScripts(
  db: Firestore,
  ownerUid: string,
): Promise<ScriptSummary[]> {
  const q = query(
    collection(db, 'scripts'),
    where('ownerUid', '==', ownerUid),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: d.data().title as string,
      updatedAt: d.data().updatedAt as number,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Borra un guion y todas sus líneas. */
export async function deleteScript(
  db: Firestore,
  scriptId: string,
): Promise<void> {
  const scriptRef = doc(db, 'scripts', scriptId);
  const linesSnap = await getDocs(collection(scriptRef, 'lines'));
  const batch = writeBatch(db);
  for (const lineDoc of linesSnap.docs) {
    batch.delete(lineDoc.ref);
  }
  batch.delete(scriptRef);
  await batch.commit();
}
