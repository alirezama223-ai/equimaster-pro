import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function HomeTab() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>EQUIMASTER PRO</Text>
        <View style={styles.row}><View><Text style={styles.greeting}>{email ? 'Welcome back' : 'Welcome'}</Text><Text style={styles.name}>{email ? email.split('@')[0] : 'Horse manager'}</Text></View><Text style={styles.avatar}>🐴</Text></View>
        <View style={styles.hero}><Text style={styles.heroKicker}>TODAY</Text><Text style={styles.heroTitle}>Your stable at a glance.</Text><Text style={styles.heroBody}>Tasks, horses, training and appointments in one place.</Text></View>
        <Text style={styles.section}>Quick actions</Text>
        <View style={styles.grid}>
          <Action icon="🐴" title="My Horses" onPress={() => router.push('/(tabs)/horses')} />
          <Action icon="🔔" title="Reminders" onPress={() => router.push('/(tabs)/calendar')} />
          <Action icon="🏇" title="Training" onPress={() => {}} />
          <Action icon="🌾" title="Feeding" onPress={() => {}} />
        </View>
        <Text style={styles.section}>Coming next</Text>
        <View style={styles.card}><Text style={styles.cardTitle}>Smart horse management</Text><Text style={styles.cardBody}>Breeding recommendations, training plans and stable management will become native mobile features — not web pages.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionTitle}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' }, container: { padding: 20, paddingBottom: 36 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, opacity: 0.55, marginBottom: 14 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, greeting: { fontSize: 16, opacity: 0.55 }, name: { marginTop: 2, fontSize: 28, fontWeight: '800', textTransform: 'capitalize' }, avatar: { fontSize: 36 }, hero: { marginTop: 24, padding: 22, borderRadius: 24, backgroundColor: '#1F2933' }, heroKicker: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, opacity: 0.65 }, heroTitle: { marginTop: 8, color: '#FFFFFF', fontSize: 27, lineHeight: 33, fontWeight: '800' }, heroBody: { marginTop: 9, color: '#FFFFFF', fontSize: 15, lineHeight: 22, opacity: 0.72 }, section: { marginTop: 26, marginBottom: 12, fontSize: 18, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, action: { width: '48%', minHeight: 118, padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'space-between' }, pressed: { transform: [{ scale: 0.98 }], opacity: 0.8 }, actionIcon: { fontSize: 30 }, actionTitle: { fontSize: 16, fontWeight: '800' }, card: { padding: 18, borderRadius: 18, backgroundColor: '#FFFFFF' }, cardTitle: { fontSize: 16, fontWeight: '800' }, cardBody: { marginTop: 8, fontSize: 14, lineHeight: 21, opacity: 0.62 } });
