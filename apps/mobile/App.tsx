import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSceneLines } from '@dialog/core';
import { buildDemoScript } from './src/demo/demoScript';

export default function App() {
  const { script, scene } = buildDemoScript();
  const lines = getSceneLines(script, scene.id);
  const characterName = (characterId: string | null): string =>
    script.characters.find((c) => c.id === characterId)?.name ?? 'Acotación';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{script.title}</Text>
        <Text style={styles.scene}>{scene.title}</Text>
        {lines.map((line) => (
          <View key={line.id} style={styles.lineRow}>
            <Text style={styles.character}>
              {characterName(line.characterId)}:{' '}
            </Text>
            <Text style={styles.line}>{line.text}</Text>
          </View>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 64, gap: 8 },
  title: { fontSize: 24, fontWeight: '700' },
  scene: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  lineRow: { flexDirection: 'row', flexWrap: 'wrap' },
  line: { fontSize: 16, lineHeight: 24 },
  character: { fontWeight: '700', fontSize: 16, lineHeight: 24 },
});
