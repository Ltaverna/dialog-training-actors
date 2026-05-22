'use client';

import { getSceneLines, type Script } from '@dialog/core';

export function ScriptViewer({ script }: { script: Script }) {
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <article className="grid gap-6">
      <h1 className="text-2xl font-bold">{script.title}</h1>
      {script.scenes.map((scene) => (
        <section key={scene.id} className="grid gap-2">
          <h2 className="text-lg font-semibold">{scene.title}</h2>
          <ol className="grid gap-1">
            {getSceneLines(script, scene.id).map((line) => (
              <li key={line.id}>
                <span className="font-semibold">
                  {characterName(line.characterId)}:{' '}
                </span>
                {line.text}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}
