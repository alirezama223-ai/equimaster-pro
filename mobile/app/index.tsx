import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

type SessionState = 'loading' | 'signed-in' | 'signed-out';

export default function HomeScreen() {
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
      setSessionState(data.session ? 'signed-in' : 'signed-out');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setEmail(session?.user.email ?? null);
      setSessionState(session ? 'signed-in' : 'signed-out');
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (sessionState === 'loading') {
    return <View style={styles.loading}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Loading EquiMaster Pro…</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>EQUIMASTER PRO</Text>
        <Text style={styles.title}>Your stable, in your pocket.</Text>
        <Text style={styles.subtitle}>
          A purpose-built horse management app — not a mobile website.
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TODAY</Text>
          <Text style={styles.heroTitle}>Everything about your horses, at a glance.</Text>
          <Text style={styles.heroBody}>Reminders, training, feeding, veterinary appointments and more.</Text>
        </View>

        <View style={styles.grid}>
          <Feature title="🐴 My Horses" body="Profiles & records" />
          <Feature title="🔔 Reminders" body="Never miss a task" />
          <Feature title="📅 Calendar" body="Vet & farrier" />
          <Feature title="🏇 Training" body="Plans & progress" />
          <Feature title="🧬 Breeding" body="Smart matching" />
          <Feature title="🌾 Feeding" body="Stable management" />
        </View>

        {sessionState === 'signed-in' ? (
          <View style={styles.accountCard}>
            <Text style={styles.accountTitle}>Signed in</Text>
            <Text style={styles.accountEmail}>{email}</Text>
            <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.accountCard}>
            <Text style={styles.accountTitle}>Your account</Text>
            <Text style={styles.accountEmail}>Authentication is connected to the existing EquiMaster backend.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return <View style={styles.feature}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureBody}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' },
  loadingText: { marginTop: 12, fontSize: 16 },
  container: { padding: 22, paddingBottom: 40 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '800', maxWidth: 360 },
  subtitle: { marginTop: 12, fontSize: 17, lineHeight: 25, opacity: 0.7 },
  heroCard: { marginTop: 26, padding: 22, borderRadius: 24, backgroundColor: '#1F2933' },
  heroLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, opacity: 0.7 },
  heroTitle: { color: '#FFFFFF', marginTop: 9, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  heroBody: { color: '#FFFFFF', marginTop: 10, fontSize: 15, lineHeight: 22, opacity: 0.75 },
  grid: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  feature: { width: '48%', minHeight: 112, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
  featureTitle: { fontSize: 16, fontWeight: '800' },
  featureBody: { marginTop: 7, fontSize: 13, opacity: 0.6 },
  accountCard: { marginTop: 16, padding: 18, borderRadius: 18, backgroundColor: '#FFFFFF' },
  accountTitle: { fontSize: 16, fontWeight: '800' },
  accountEmail: { marginTop: 7, fontSize: 14, opacity: 0.65 },
  button: { marginTop: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1F2933', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
