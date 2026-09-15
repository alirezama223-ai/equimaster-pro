import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

type HorseRow = Record<string, unknown>;

function text(row: HorseRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

export default function HorsesScreen() {
  const [horses, setHorses] = useState<HorseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: queryError } = await supabase.from('horse_listings').select('*').order('created_at', { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setHorses([]);
    } else {
      setHorses((data ?? []) as HorseRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading your horses…</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={horses}
        keyExtractor={(item, index) => text(item, 'id', 'uuid') || String(index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={horses.length ? styles.list : styles.emptyList}
        ListHeaderComponent={<View><Text style={styles.title}>My Horses</Text><Text style={styles.subtitle}>{horses.length} {horses.length === 1 ? 'horse' : 'horses'} in your stable</Text>{error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}</View>}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>🐴</Text><Text style={styles.emptyTitle}>No horses yet</Text><Text style={styles.emptyBody}>Add your first horse on EquiMaster Pro. It will appear here automatically.</Text></View>}
        renderItem={({ item }) => <HorseCard row={item} />}
      />
    </SafeAreaView>
  );
}

function HorseCard({ row }: { row: HorseRow }) {
  const name = text(row, 'name', 'horse_name', 'title') || 'Unnamed horse';
  const breed = text(row, 'breed', 'breed_name');
  const gender = text(row, 'gender', 'sex');
  const age = text(row, 'age', 'years');
  const country = text(row, 'country');
  const detail = [breed, gender, age ? `${age} yrs` : '', country].filter(Boolean).join(' • ');
  return <Pressable style={({ pressed }) => [styles.horse, pressed && styles.pressed]}><View style={styles.horseAvatar}><Text style={styles.horseEmoji}>🐴</Text></View><View style={styles.horseInfo}><Text style={styles.horseName}>{name}</Text><Text style={styles.horseDetail}>{detail || 'Horse profile'}</Text><Text style={styles.horseAction}>Open profile ›</Text></View></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' }, muted: { marginTop: 10, opacity: 0.55 }, list: { padding: 20, paddingBottom: 40 }, emptyList: { flexGrow: 1, padding: 20 }, title: { fontSize: 30, fontWeight: '800' }, subtitle: { marginTop: 5, fontSize: 15, opacity: 0.55 }, error: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#F4E5E2' }, errorText: { fontSize: 13, lineHeight: 18 }, horse: { marginTop: 14, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] }, horseAvatar: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EEE8' }, horseEmoji: { fontSize: 34 }, horseInfo: { flex: 1, marginLeft: 14 }, horseName: { fontSize: 18, fontWeight: '800' }, horseDetail: { marginTop: 5, fontSize: 13, opacity: 0.58 }, horseAction: { marginTop: 10, fontSize: 13, fontWeight: '700' }, empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }, emptyIcon: { fontSize: 52 }, emptyTitle: { marginTop: 12, fontSize: 22, fontWeight: '800' }, emptyBody: { marginTop: 8, textAlign: 'center', fontSize: 15, lineHeight: 22, opacity: 0.58 } });
