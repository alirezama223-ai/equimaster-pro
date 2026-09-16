import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { syncReminderNotifications } from '../../lib/notifications';

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  reminder_type: string;
  due_at: string;
  recurrence_rule: string | null;
  remind_before_minutes: number;
  status: string;
  enabled: boolean;
};

export default function RemindersTab() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true); else setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('reminders')
      .select('id,title,description,reminder_type,due_at,recurrence_rule,remind_before_minutes,status,enabled')
      .eq('status', 'pending')
      .eq('enabled', true)
      .order('due_at', { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      const reminders = (data ?? []) as Reminder[];
      setItems(reminders);
      setSyncing(true);
      try {
        await syncReminderNotifications(reminders);
      } catch (notificationError) {
        setError(notificationError instanceof Error ? notificationError.message : 'Could not schedule notifications.');
      } finally {
        setSyncing(false);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.muted}>Loading reminders…</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Text style={styles.eyebrow}>SHABDIZ</Text>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.subtitle}>Your stable tasks — with native notifications.</Text>

        {syncing ? <View style={styles.sync}><Text style={styles.syncText}>🔔 Syncing notifications…</Text></View> : null}
        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Nothing due</Text>
            <Text style={styles.muted}>Your active reminders will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => <ReminderCard key={item.id} reminder={item} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const due = new Date(reminder.due_at);
  const date = due.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  const time = due.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <Text style={styles.type}>{reminder.reminder_type.replaceAll('_', ' ')}</Text>
        <Text style={styles.when}>{date} · {time}</Text>
      </View>
      <Text style={styles.cardTitle}>{reminder.title}</Text>
      {reminder.description ? <Text style={styles.cardBody} numberOfLines={2}>{reminder.description}</Text> : null}
      <View style={styles.cardBottom}>
        <Text style={styles.lead}>Notify {reminder.remind_before_minutes} min before</Text>
        {reminder.recurrence_rule ? <Text style={styles.repeat}>{reminder.recurrence_rule}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' },
  container: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, opacity: 0.55 },
  title: { marginTop: 10, fontSize: 32, fontWeight: '800' },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 21, opacity: 0.6 },
  sync: { marginTop: 16, padding: 11, borderRadius: 12, backgroundColor: '#E9F3EE' },
  syncText: { fontSize: 13, fontWeight: '700' },
  list: { marginTop: 22, gap: 12 },
  card: { padding: 17, borderRadius: 19, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  type: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', opacity: 0.5 },
  when: { fontSize: 12, fontWeight: '700', opacity: 0.65 },
  cardTitle: { marginTop: 10, fontSize: 18, fontWeight: '800' },
  cardBody: { marginTop: 7, fontSize: 14, lineHeight: 20, opacity: 0.62 },
  cardBottom: { marginTop: 13, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lead: { fontSize: 12, fontWeight: '700', opacity: 0.52 },
  repeat: { fontSize: 12, fontWeight: '700', opacity: 0.52 },
  empty: { marginTop: 28, padding: 30, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center' },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { marginTop: 12, fontSize: 20, fontWeight: '800' },
  muted: { marginTop: 7, fontSize: 14, opacity: 0.6 },
  error: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: '#FCECEC' },
  errorText: { fontSize: 13, lineHeight: 18 },
});
