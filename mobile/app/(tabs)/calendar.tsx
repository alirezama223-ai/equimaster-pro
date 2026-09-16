import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { syncReminderNotifications } from '../../lib/notifications';

type Reminder = { id: string; title: string; description: string | null; reminder_type: string; due_at: string; remind_before_minutes: number; };

export default function CalendarScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase.from('reminders')
      .select('id,title,description,reminder_type,due_at,remind_before_minutes')
      .eq('status', 'pending').eq('enabled', true)
      .gte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true }).limit(50);
    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      const reminders = (data ?? []) as Reminder[];
      setItems(reminders);
      try { await syncReminderNotifications(reminders); } catch (e) { setError(e instanceof Error ? e.message : 'Could not sync notifications.'); }
    }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading calendar…</Text></View>;
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
      <Text style={styles.eyebrow}>SHABDIZ</Text>
      <Text style={styles.title}>Calendar</Text>
      <Text style={styles.subtitle}>Vet, farrier, training and stable appointments.</Text>
      <View style={styles.today}><Text style={styles.kicker}>TODAY</Text><Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <Text style={styles.section}>Upcoming</Text>
      {items.length === 0 ? <View style={styles.empty}><Text style={styles.icon}>📅</Text><Text style={styles.emptyTitle}>Your calendar is clear</Text><Text style={styles.emptyBody}>Active reminders will appear here automatically.</Text></View> : <View style={styles.list}>{items.map((item) => <CalendarItem key={item.id} item={item} />)}</View>}
    </ScrollView>
  </SafeAreaView>;
}

function CalendarItem({ item }: { item: Reminder }) {
  const date = new Date(item.due_at);
  return <Pressable style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
    <View style={styles.dateBox}><Text style={styles.day}>{date.toLocaleDateString(undefined, { day: '2-digit' })}</Text><Text style={styles.month}>{date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text></View>
    <View style={styles.itemCopy}><Text style={styles.itemTime}>{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {item.reminder_type.replaceAll('_', ' ')}</Text><Text style={styles.itemTitle}>{item.title}</Text>{item.description ? <Text style={styles.itemBody} numberOfLines={2}>{item.description}</Text> : null}<Text style={styles.notify}>🔔 {item.remind_before_minutes} min before</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' }, container: { padding: 20, paddingBottom: 45 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, opacity: 0.55 }, title: { marginTop: 10, fontSize: 32, fontWeight: '900' }, subtitle: { marginTop: 6, fontSize: 15, lineHeight: 21, opacity: 0.58 }, today: { marginTop: 20, padding: 20, borderRadius: 20, backgroundColor: '#0E5A45' }, kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#DCEBE5' }, date: { marginTop: 8, fontSize: 19, fontWeight: '900', color: '#FFFFFF' }, section: { marginTop: 28, marginBottom: 12, fontSize: 21, fontWeight: '900' }, list: { gap: 11 }, item: { padding: 15, borderRadius: 19, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 14 }, pressed: { opacity: 0.8 }, dateBox: { width: 54, height: 58, borderRadius: 14, backgroundColor: '#E9F3EE', alignItems: 'center', justifyContent: 'center' }, day: { fontSize: 20, fontWeight: '900', color: '#0E5A45' }, month: { marginTop: 1, fontSize: 10, fontWeight: '900', color: '#0E5A45' }, itemCopy: { flex: 1 }, itemTime: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', opacity: 0.5 }, itemTitle: { marginTop: 5, fontSize: 17, fontWeight: '900' }, itemBody: { marginTop: 4, lineHeight: 19, fontSize: 13, opacity: 0.62 }, notify: { marginTop: 7, fontSize: 11, fontWeight: '700', color: '#0E5A45' }, empty: { marginTop: 10, padding: 28, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center' }, icon: { fontSize: 40 }, emptyTitle: { marginTop: 10, fontSize: 19, fontWeight: '900' }, emptyBody: { marginTop: 6, textAlign: 'center', lineHeight: 20, opacity: 0.58 }, muted: { marginTop: 8, opacity: 0.55 }, error: { marginTop: 16, padding: 12, borderRadius: 13, backgroundColor: '#FCECEC' }, errorText: { color: '#8C2F2F', fontSize: 13 } });
