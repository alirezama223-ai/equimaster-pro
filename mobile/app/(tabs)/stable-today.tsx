import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Horse = { id: string; name: string };
type Reminder = { id: string; horse_id: string | null; competition_id: string | null; title: string; reminder_type: string; due_at: string };
type Training = { id: string; horse_id: string; discipline: string | null; duration_minutes: number | null; training_date: string; rating: number | null };
type Competition = { id: string; horse_id: string | null; name: string; venue: string | null; class_name: string | null; competition_date: string; status: string };
type AgendaItem = { id: string; kind: 'reminder' | 'training' | 'competition'; title: string; meta: string; time: number; horseName?: string; competitionId?: string; horseId?: string };

const dayLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export default function StableTodayScreen() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => { const d = new Date(today); d.setHours(0, 0, 0, 0); return d; }, [today]);
  const end = useMemo(() => { const d = new Date(today); d.setHours(23, 59, 59, 999); return d; }, [today]);

  const load = useCallback(async (pull = false) => {
    pull ? setRefreshing(true) : setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in first.'); setLoading(false); setRefreshing(false); return; }
    const from = start.toISOString();
    const to = end.toISOString();
    const [{ data: h, error: he }, { data: r, error: re }, { data: t, error: te }, { data: c, error: ce }] = await Promise.all([
      supabase.from('horse_listings').select('id,name').eq('user_id', user.id).order('name'),
      supabase.from('reminders').select('id,horse_id,competition_id,title,reminder_type,due_at').eq('user_id', user.id).eq('status', 'pending').eq('enabled', true).gte('due_at', from).lte('due_at', to).order('due_at'),
      supabase.from('training_sessions').select('id,horse_id,discipline,duration_minutes,training_date,rating').eq('user_id', user.id).gte('training_date', from).lte('training_date', to).order('training_date'),
      supabase.from('competitions').select('id,horse_id,name,venue,class_name,competition_date,status').eq('user_id', user.id).gte('competition_date', from).lte('competition_date', to).order('competition_date')
    ]);
    const firstError = he ?? re ?? te ?? ce;
    if (firstError) setError(firstError.message);
    const hs = (h ?? []) as Horse[];
    const rs = (r ?? []) as Reminder[];
    const ts = (t ?? []) as Training[];
    const cs = (c ?? []) as Competition[];
    const horseMap = new Map(hs.map(x => [x.id, x.name]));
    const agenda: AgendaItem[] = [
      ...rs.map(x => ({ id: `r-${x.id}`, kind: 'reminder' as const, title: x.title, meta: `${timeLabel(x.due_at)} · ${x.reminder_type}`, time: new Date(x.due_at).getTime(), horseName: x.horse_id ? horseMap.get(x.horse_id) : undefined, competitionId: x.competition_id ?? undefined, horseId: x.horse_id ?? undefined })),
      ...ts.map(x => ({ id: `t-${x.id}`, kind: 'training' as const, title: x.discipline ? `Training · ${x.discipline}` : 'Training session', meta: `${timeLabel(x.training_date)} · ${x.duration_minutes ? `${x.duration_minutes} min` : 'duration not set'}${x.rating != null ? ` · ${x.rating}/10` : ''}`, time: new Date(x.training_date).getTime(), horseName: horseMap.get(x.horse_id), horseId: x.horse_id })),
      ...cs.map(x => ({ id: `c-${x.id}`, kind: 'competition' as const, title: `🏆 ${x.name}`, meta: `${timeLabel(x.competition_date)}${x.venue ? ` · ${x.venue}` : ''}${x.class_name ? ` · ${x.class_name}` : ''}`, time: new Date(x.competition_date).getTime(), horseName: x.horse_id ? horseMap.get(x.horse_id) : undefined, competitionId: x.id, horseId: x.horse_id ?? undefined }))
    ].sort((a, b) => a.time - b.time);
    setHorses(hs);
    setItems(agenda);
    setLoading(false);
    setRefreshing(false);
  }, [start, end]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({ reminders: items.filter(x => x.kind === 'reminder').length, training: items.filter(x => x.kind === 'training').length, competitions: items.filter(x => x.kind === 'competition').length }), [items]);

  function open(item: AgendaItem) {
    if (item.kind === 'training') router.push(`/(tabs)/training?horseId=${item.horseId ?? ''}`);
    else if (item.competitionId) router.push(`/(tabs)/competition/day/${item.competitionId}`);
    else router.push('/(tabs)/reminders');
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading today…</Text></View>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.brand}>SHABDIZ</Text>
    <Text style={styles.title}>Today at the Stable</Text>
    <Text style={styles.date}>{dayLabel(today)}</Text>
    <Text style={styles.subtitle}>One clear agenda for training, care and competition day tasks.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.summary}><Stat value={String(horses.length)} label="Horses" /><Stat value={String(stats.training)} label="Training" /><Stat value={String(stats.reminders)} label="Care / tasks" /><Stat value={String(stats.competitions)} label="Competitions" /></View>
    <View style={styles.quick}><Quick title="🏇 Add training" onPress={() => router.push('/(tabs)/training')} /><Quick title="🔔 Add reminder" onPress={() => router.push('/(tabs)/add-reminder')} /><Quick title="🏆 Competitions" onPress={() => router.push('/(tabs)/competitions')} /></View>
    <Text style={styles.section}>Today’s agenda</Text>
    {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>🌿</Text><Text style={styles.emptyTitle}>Nothing scheduled today</Text><Text style={styles.emptyText}>A quiet day is still useful. Add a training session or a care reminder when you need one.</Text><Pressable style={styles.primary} onPress={() => router.push('/(tabs)/add-reminder')}><Text style={styles.primaryText}>Add a reminder</Text></Pressable></View> : items.map(item => <Pressable key={item.id} onPress={() => open(item)} style={styles.item}><View style={[styles.dot, item.kind === 'competition' ? styles.compDot : item.kind === 'training' ? styles.trainDot : styles.remDot]} /><View style={styles.itemBody}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemMeta}>{item.meta}</Text>{item.horseName ? <Text style={styles.horse}>🐎 {item.horseName}</Text> : null}</View><Text style={styles.arrow}>›</Text></Pressable>)}
    <View style={styles.footer}><Text style={styles.footerTitle}>Stable workflow</Text><Text style={styles.footerText}>Use Today for the daily agenda, Calendar for the wider schedule, and Stable Dashboard for the full stable overview.</Text><Pressable onPress={() => router.push('/(tabs)/calendar')}><Text style={styles.link}>Open Calendar ›</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}
function Stat({ value, label }: { value: string; label: string }) { return <View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Quick({ title, onPress }: { title: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.quickButton}><Text style={styles.quickText}>{title}</Text></Pressable>; }
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5F0',
  },
  back: {
    color: '#0E5A45',
    fontWeight: '800',
    marginBottom: 14,
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#0E5A45',
  },
  title: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: '900',
  },
  date: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '800',
    color: '#0E5A45',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.58,
  },
  summary: {
    marginTop: 18,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#0E5A45',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFF',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '800',
    color: '#DCEBE5',
  },
  quick: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1DFD9',
  },
  quickText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0E5A45',
  },
  section: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 21,
    fontWeight: '900',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFF',
    marginBottom: 9,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  compDot: {
    backgroundColor: '#0E5A45',
  },
  trainDot: {
    backgroundColor: '#55748B',
  },
  remDot: {
    backgroundColor: '#B9853A',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 11,
    opacity: 0.6,
  },
  horse: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5A45',
  },
  arrow: {
    fontSize: 25,
    color: '#0E5A45',
    marginLeft: 8,
  },
  empty: {
    padding: 28,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    marginTop: 9,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.58,
  },
  primary: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#0E5A45',
  },
  primaryText: {
    color: '#FFF',
    fontWeight: '900',
  },
  footer: {
    marginTop: 18,
    padding: 17,
    borderRadius: 19,
    backgroundColor: '#E9F3EE',
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0E5A45',
  },
  footerText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 19,
    opacity: 0.62,
  },
  link: {
    marginTop: 10,
    color: '#0E5A45',
    fontWeight: '900',
  },
  muted: {
    marginTop: 6,
    opacity: 0.55,
  },
  error: {
    marginTop: 12,
    color: '#A33A2B',
    fontWeight: '700',
  },
});