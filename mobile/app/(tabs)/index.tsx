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
        <View style={styles.header}>
          <View><Text style={styles.brand}>SHABDIZ</Text><Text style={styles.platform}>Equestrian Platform</Text></View>
          <Pressable onPress={() => router.push('/(tabs)/account')} style={styles.profile}><Text style={styles.profileIcon}>●</Text></Pressable>
        </View>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>WELCOME TO</Text>
          <Text style={styles.heroTitle}>SHABDIZ</Text>
          <Text style={styles.heroBody}>Your complete equestrian world — horses, training, marketplace and intelligent tools.</Text>
          <Pressable onPress={() => router.push('/(tabs)/explore')} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}><Text style={styles.heroButtonText}>Explore SHABDIZ</Text></Pressable>
        </View>
        <Text style={styles.section}>Your Equestrian World</Text>
        <View style={styles.grid}>
          <Action icon="🐴" title="My Horses" subtitle="Manage your horses" onPress={() => router.push('/(tabs)/horses')} />
          <Action icon="🏇" title="Training" subtitle="Training & progress" onPress={() => router.push('/(tabs)/explore')} />
          <Action icon="🛒" title="Marketplace" subtitle="Find your next horse" onPress={() => router.push('/(tabs)/explore')} />
          <Action icon="🧬" title="Breeding" subtitle="Smart breeding tools" onPress={() => router.push('/(tabs)/explore')} />
        </View>
        <View style={styles.accountHint}><Text style={styles.accountHintTitle}>{email ? 'Your account is connected' : 'Connect your account'}</Text><Text style={styles.accountHintBody}>{email ? email : 'Sign in to sync horses, training and reminders.'}</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionIcon}>{icon}</Text><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' },
  container: { padding: 22, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 37, fontWeight: '900', letterSpacing: 2.5, color: '#0E5A45' },
  platform: { marginTop: 1, fontSize: 16, fontWeight: '600', color: '#777D79' },
  profile: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDDCD7', alignItems: 'center', justifyContent: 'center' },
  profileIcon: { fontSize: 31, color: '#55748B' },
  hero: { marginTop: 30, padding: 30, borderRadius: 30, backgroundColor: '#123F31' },
  heroKicker: { color: '#F7F5F0', fontSize: 14, fontWeight: '900', letterSpacing: 2.5, opacity: 0.85 },
  heroTitle: { marginTop: 12, color: '#FFFFFF', fontSize: 53, lineHeight: 57, fontWeight: '900', letterSpacing: 1 },
  heroBody: { marginTop: 18, color: '#F7F5F0', fontSize: 19, lineHeight: 29, fontWeight: '600', opacity: 0.92 },
  heroButton: { marginTop: 25, alignSelf: 'flex-start', paddingVertical: 16, paddingHorizontal: 25, borderRadius: 16, backgroundColor: '#FFFFFF' },
  heroButtonText: { color: '#123F31', fontSize: 17, fontWeight: '900' },
  section: { marginTop: 34, marginBottom: 16, fontSize: 31, fontWeight: '900', color: '#151817' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  action: { width: '47.5%', minHeight: 145, padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DFD9', justifyContent: 'space-between' },
  actionIcon: { fontSize: 31 },
  actionTitle: { marginTop: 8, fontSize: 19, fontWeight: '900', color: '#151817' },
  actionSubtitle: { marginTop: 4, fontSize: 14, lineHeight: 19, fontWeight: '600', color: '#777D79' },
  accountHint: { marginTop: 18, padding: 18, borderRadius: 20, backgroundColor: '#E9EEE9' },
  accountHintTitle: { fontSize: 15, fontWeight: '900', color: '#123F31' },
  accountHintBody: { marginTop: 5, fontSize: 13, color: '#5F6B65' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
