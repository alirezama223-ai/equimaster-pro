import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Session = { id: string; horse_id: string; training_date: string; discipline: string; duration_minutes: number | null; rating: number | null; notes: string | null };
type Horse = { id: string; name: string };

export default function TrainingScreen() {
  const params = useLocalSearchParams<{ horseId?: string | string[] }>();
  const requestedHorseId = Array.isArray(params.horseId) ? params.horseId[0] : params.horseId;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseId, setHorseId] = useState(requestedHorseId ?? '');
  const [discipline, setDiscipline] = useState('Show Jumping');
  const [duration, setDuration] = useState('45');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in to use Training.'); setLoading(false); return; }

    const [{ data: horseRows, error: horseError }, { data: sessionRows, error: sessionError }] = await Promise.all([
      supabase.from('horse_listings').select('id,name').eq('user_id', user.id).order('name'),
      supabase.from('training_sessions').select('id,horse_id,training_date,discipline,duration_minutes,rating,notes').eq('user_id', user.id).order('training_date', { ascending: false }).limit(30),
    ]);
    if (horseError) setError(horseError.message);
    else setHorses((horseRows ?? []) as Horse[]);
    if (sessionError) setError(sessionError.message);
    else setSessions((sessionRows ?? []) as Session[]);
    if (requestedHorseId && horseRows?.some((horse) => horse.id === requestedHorseId)) setHorseId(requestedHorseId);
    else if (!horseId && horseRows?.[0]?.id) setHorseId(horseRows[0].id);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [requestedHorseId]);

  async function addSession() {
    setError(null);
    if (!horseId) { setError('Select a horse first.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in first.'); setSaving(false); return; }
    const parsedDuration = duration.trim() ? Number(duration) : null;
    const parsedRating = rating.trim() ? Number(rating) : null;
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) { setError('Minutes must be a positive number.'); setSaving(false); return; }
    if (parsedRating !== null && (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 10)) { setError('Rating must be an integer from 1 to 10.'); setSaving(false); return; }
    const { error: insertError } = await supabase.from('training_sessions').insert({
      user_id: user.id, horse_id: horseId, training_date: new Date().toISOString(),
      discipline: discipline.trim() || 'General Training', duration_minutes: parsedDuration, rating: parsedRating,
      notes: notes.trim() || null,
    });
    if (insertError) setError(insertError.message);
    else { setNotes(''); setRating(''); await load(); }
    setSaving(false);
  }

  const horseName = (id: string) => horses.find((horse) => horse.id === id)?.name ?? 'Horse';

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Explore</Text></Pressable>
      <Text style={styles.brand}>SHABDIZ</Text>
      <Text style={styles.title}>Training Center</Text>
      <Text style={styles.subtitle}>Record every ride and build a clear training history.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>New training session</Text>
        <Text style={styles.label}>Horse</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {horses.map((horse) => <Pressable key={horse.id} onPress={() => setHorseId(horse.id)} style={[styles.chip, horse.id === horseId && styles.chipActive]}><Text style={[styles.chipText, horse.id === horseId && styles.chipTextActive]}>{horse.name}</Text></Pressable>)}
        </ScrollView>
        <Text style={styles.label}>Discipline</Text>
        <TextInput value={discipline} onChangeText={setDiscipline} style={styles.input} placeholder="e.g. Show Jumping" />
        <View style={styles.rowInputs}><View style={styles.half}><Text style={styles.label}>Minutes</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View><View style={styles.half}><Text style={styles.label}>Rating 1–10</Text><TextInput value={rating} onChangeText={setRating} keyboardType="number-pad" style={styles.input} /></View></View>
        <Text style={styles.label}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.notes]} placeholder="What went well? What needs work?" multiline />
        <Pressable disabled={saving || loading} onPress={addSession} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{saving ? 'Saving…' : 'Add training session'}</Text></Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Text style={styles.historyTitle}>Training history</Text>
      {loading ? <ActivityIndicator /> : sessions.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No sessions yet</Text><Text style={styles.muted}>Your first ride can be recorded above.</Text></View> : sessions.map((session) => <View key={session.id} style={styles.session}><View style={styles.sessionTop}><Text style={styles.sessionHorse}>{horseName(session.horse_id)}</Text><Text style={styles.date}>{new Date(session.training_date).toLocaleDateString()}</Text></View><Text style={styles.sessionDiscipline}>{session.discipline}{session.duration_minutes ? ` • ${session.duration_minutes} min` : ''}{session.rating ? ` • ${session.rating}/10` : ''}</Text>{session.notes ? <Text style={styles.sessionNotes}>{session.notes}</Text> : null}</View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, content: { padding: 20, paddingBottom: 50 }, back: { color: '#0E5A45', fontWeight: '800', marginBottom: 14 }, brand: { fontSize: 30, fontWeight: '900', letterSpacing: 2.5, color: '#0E5A45' }, title: { marginTop: 16, fontSize: 32, fontWeight: '900', color: '#151817' }, subtitle: { marginTop: 5, marginBottom: 20, fontSize: 15, lineHeight: 22, color: '#777D79' }, card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#E1DFD9' }, sectionTitle: { fontSize: 19, fontWeight: '900', marginBottom: 14 }, label: { marginTop: 10, marginBottom: 6, fontSize: 12, fontWeight: '800', color: '#777D79' }, chips: { gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, backgroundColor: '#F1EFE9' }, chipActive: { backgroundColor: '#0E5A45' }, chipText: { fontWeight: '800', color: '#555C58' }, chipTextActive: { color: '#FFFFFF' }, input: { minHeight: 46, borderWidth: 1, borderColor: '#DCD9D1', borderRadius: 13, paddingHorizontal: 12, backgroundColor: '#FAFAF8', fontSize: 15 }, rowInputs: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, notes: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }, button: { marginTop: 16, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E5A45' }, pressed: { opacity: 0.8 }, buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 }, error: { marginTop: 12, color: '#A33A2B', lineHeight: 20 }, historyTitle: { marginTop: 28, marginBottom: 12, fontSize: 22, fontWeight: '900' }, session: { marginBottom: 10, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF' }, sessionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, sessionHorse: { fontSize: 16, fontWeight: '900' }, date: { fontSize: 12, color: '#777D79' }, sessionDiscipline: { marginTop: 6, fontWeight: '700', color: '#0E5A45' }, sessionNotes: { marginTop: 7, lineHeight: 20, color: '#666D69' }, empty: { padding: 24, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center' }, emptyTitle: { fontWeight: '900', fontSize: 16 }, muted: { marginTop: 5, color: '#777D79' } });