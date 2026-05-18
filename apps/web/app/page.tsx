import { getSceneLines } from '@dialog/core';
import { buildDemoScript } from '@/src/demo/demoScript';

export default function Home(): React.JSX.Element {
  const { script, scene } = buildDemoScript();
  const lines = getSceneLines(script, scene.id);
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 640 }}>
      <h1>{script.title}</h1>
      <h2>{scene.title}</h2>
      <ol>
        {lines.map((line) => (
          <li key={line.id}>
            <strong>{characterName(line.characterId)}: </strong>
            {line.text}
          </li>
        ))}
      </ol>
    </main>
  );
}
