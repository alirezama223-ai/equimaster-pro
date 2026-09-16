import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
  cream: '#F7F5F0',
  green: '#174D3F',
  greenDark: '#103D32',
  gold: '#D9A93A',
  goldSoft: '#B8892F',
  text: '#17382F',
  muted: '#7B817D',
  white: '#FFFFFF',
  line: '#E7E3DA',
  softGreen: '#EAF2EE',
  softGold: '#F7F0DE',
};

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
    const { data, error: queryError } = await supabase
      .from('horse_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setHorses([]);
    } else {
      setHorses((data ?? []) as HorseRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const countLabel = useMemo(
    () => `${horses.length} ${horses.length === 1 ? 'horse' : 'horses'}`,
    [horses.length],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Loading your stable…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={horses}
        keyExtractor={(item, index) => text(item, 'id', 'uuid') || String(index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.green}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={horses.length ? styles.list : styles.emptyList}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Image
                source={require('../../assets/shabdiz-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Pressable
                onPress={() => router.push('/(tabs)/account')}
                style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
                accessibilityLabel="Open settings"
              >
                <Text style={styles.settingsText}>⚙</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.intro}>
              <Text style={styles.kicker}>YOUR STABLE</Text>
              <Text style={styles.title}>My Horses</Text>
              <Text style={styles.subtitle}>
                {countLabel} in your SHABDIZ stable.
              </Text>
            </View>

            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryLabel}>ACTIVE HORSES</Text>
                <Text style={styles.summaryValue}>{horses.length}</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>S</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.error}>
                <Text style={styles.errorTitle}>Couldn’t load your horses</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Your horses</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🐎</Text>
            </View>
            <Text style={styles.emptyTitle}>Your stable is ready.</Text>
            <Text style={styles.emptyBody}>
              No horses are connected yet. Add your first horse and its profile,
              training and stable information can live here.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/add-reminder')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
            >
              <Text style={styles.emptyButtonText}>Get started</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <HorseCard row={item} />}
      />
    </SafeAreaView>
  );
}

function HorseCard({ row }: { row: HorseRow }) {
  const id = text(row, 'id', 'uuid');
  const name = text(row, 'name', 'horse_name', 'title') || 'Unnamed horse';
  const breed = text(row, 'breed', 'breed_name');
  const gender = text(row, 'gender', 'sex');
  const age = text(row, 'age', 'years');
  const country = text(row, 'country');
  const imageUrl = text(row, 'image_url', 'photo_url', 'image', 'photo');
  const detail = [breed, gender, age ? `${age} yrs` : '', country]
    .filter(Boolean)
    .join(' • ');

  return (
    <Pressable
      onPress={() => {
        if (id) router.push(`/horse/360/${id}`);
      }}
      style={({ pressed }) => [styles.horseCard, pressed && styles.pressed]}
    >
      <View style={styles.horseImageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.horseImage} resizeMode="cover" />
        ) : (
          <Text style={styles.horseEmoji}>🐎</Text>
        )}
      </View>

      <View style={styles.horseInfo}>
        <Text style={styles.horseName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.horseDetail} numberOfLines={2}>
          {detail || 'Horse profile'}
        </Text>
        <View style={styles.profileLink}>
          <Text style={styles.profileLinkText}>Open profile</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  loadingText: { marginTop: 10, color: COLORS.muted, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 42 },
  emptyList: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 42 },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 235, height: 70 },
  settings: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  settingsText: { color: COLORS.gold, fontSize: 27, lineHeight: 30, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.line },
  intro: { paddingTop: 28, paddingBottom: 20 },
  kicker: { color: COLORS.goldSoft, fontSize: 14, fontWeight: '900', letterSpacing: 2.6 },
  title: { marginTop: 7, color: COLORS.green, fontSize: 42, lineHeight: 47, fontWeight: '900' },
  subtitle: { marginTop: 6, color: COLORS.muted, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  summary: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { color: COLORS.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2.1 },
  summaryValue: { marginTop: 4, color: COLORS.white, fontSize: 34, lineHeight: 38, fontWeight: '900' },
  summaryBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: { color: COLORS.gold, fontSize: 31, fontWeight: '900' },
  error: { marginTop: 14, padding: 15, borderRadius: 17, backgroundColor: '#F4E5E2' },
  errorTitle: { color: '#7A2F26', fontSize: 14, fontWeight: '900' },
  errorText: { marginTop: 5, color: '#7A2F26', fontSize: 12, lineHeight: 18 },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 2,
    color: COLORS.green,
    fontSize: 28,
    fontWeight: '900',
  },
  horseCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horseImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softGreen,
  },
  horseImage: { width: '100%', height: '100%' },
  horseEmoji: { fontSize: 43 },
  horseInfo: { flex: 1, marginLeft: 15, minWidth: 0 },
  horseName: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  horseDetail: { marginTop: 5, color: COLORS.muted, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  profileLink: { marginTop: 9, flexDirection: 'row', alignItems: 'center' },
  profileLinkText: { color: COLORS.goldSoft, fontSize: 13, fontWeight: '900' },
  chevron: { marginLeft: 5, color: COLORS.goldSoft, fontSize: 23, lineHeight: 20 },
  empty: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.softGreen,
  },
  emptyIcon: { fontSize: 45 },
  emptyTitle: { marginTop: 18, color: COLORS.green, fontSize: 24, fontWeight: '900' },
  emptyBody: { marginTop: 9, color: COLORS.muted, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },
  emptyButtonText: { color: COLORS.greenDark, fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
