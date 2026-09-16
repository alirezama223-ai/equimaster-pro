import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Horse = Record<string, unknown>;

function value(row: Horse, ...keys: string[]) {
  for (const key of keys) {
    const item = row[key];
    if (item !== null && item !== undefined && String(item).trim()) return String(item);
  }
  return '';
}

export default function HorseProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        setError('Horse profile not found.');
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase
        .from('horse_listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!active) return;
      if (queryError) setError(queryError.message);
      else if (!data) setError('Horse profile not found or access is restricted.');
      else setHorse(data as Horse);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading horse profile…</Text></View>;

  if (error || !horse) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.icon}>🐴</Text><Text style={styles.errorTitle}>Profile unavailable</Text><Text style={styles.errorBody}>{error ?? 'Horse profile not found.'}</Text><Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Go back</Text></Pressable></View></SafeAreaView>;
  }

  const name = value(horse, 'name', 'horse_name', 'title') || 'Unnamed horse';
  const details = [value(horse, 'breed', 'breed_name'), value(horse, 'gender', 'sex'), value(horse, 'age', 'years') ? `${value(horse, 'age', 'years')} yrs` : ''].filter(Boolean).join(' • ');
  const image = value(horse, 'cover_image_url');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backLabel}>‹ Back</Text></Pressable>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.emoji}>🐴</Text></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.details}>{details || 'Horse profile'}</Text>
          {image ? <Text style={styles.imageNote}>Photo available in EquiMaster Pro</Text> : null}
        </View>

        <Section title="Horse details">
          <Row label="Breed" value={value(horse, 'breed', 'breed_name')} />
          <Row label="Gender" value={value(horse, 'gender', 'sex')} />
          <Row label="Age" value={value(horse, 'age', 'years') ? `${value(horse, 'age', 'years')} years` : ''} />
          <Row label="Height" value={value(horse, 'height') ? `${value(horse, 'height')} cm` : ''} />
          <Row label="Color" value={value(horse, 'color')} />
          <Row label="Country" value={value(horse, 'country')} />
          <Row label="Discipline" value={value(horse, 'discipline')} />
          <Row label="Level" value={value(horse, 'level')} />
        </Section>

        <Section title="Pedigree">
          <Row label="Sire" value={value(horse, 'sire')} />
          <Row label="Dam" value={value(horse, 'dam')} />
          <Row label="Dam's sire" value={value(horse, 'dam_sire')} />
        </Section>

        {value(horse, 'description') ? <Section title="Description"><Text style={styles.description}>{value(horse, 'description')}</Text></Section> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>;
}

function Row({ label, value: item }: { label: string; value: string }) {
  if (!item) return null;
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{item}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  content: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0', padding: 30 },
  muted: { marginTop: 10, opacity: 0.55 },
  icon: { fontSize: 52 },
  errorTitle: { marginTop: 12, fontSize: 22, fontWeight: '800' },
  errorBody: { marginTop: 8, textAlign: 'center', lineHeight: 21, opacity: 0.6 },
  backButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0E5A45' },
  backText: { color: '#FFFFFF', fontWeight: '800' },
  back: { marginBottom: 14 },
  backLabel: { fontSize: 16, fontWeight: '800', color: '#0E5A45' },
  hero: { alignItems: 'center', paddingVertical: 16 },
  avatar: { width: 104, height: 104, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E6DD' },
  emoji: { fontSize: 54 },
  name: { marginTop: 16, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  details: { marginTop: 6, fontSize: 15, opacity: 0.58, textAlign: 'center' },
  imageNote: { marginTop: 8, fontSize: 12, opacity: 0.45 },
  section: { marginTop: 22 },
  sectionTitle: { marginBottom: 9, fontSize: 18, fontWeight: '850' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F0EEE8' },
  label: { fontSize: 14, opacity: 0.55 },
  value: { maxWidth: '62%', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  description: { paddingVertical: 16, fontSize: 15, lineHeight: 23, opacity: 0.75 },
});
