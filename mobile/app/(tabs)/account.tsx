import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AccountScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setEmail(data.session?.user.email ?? null); setLoading(false); }); }, []);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        {email ? <><View style={styles.profile}><Text style={styles.avatar}>👤</Text><View><Text style={styles.label}>Signed in as</Text><Text style={styles.email}>{email}</Text></View></View><Pressable style={styles.button} onPress={async () => { await supabase.auth.signOut(); }}><Text style={styles.buttonText}>Sign out</Text></Pressable></> : <><Text style={styles.subtitle}>Sign in to sync your horses, reminders and calendar across devices.</Text><Pressable style={styles.button} onPress={() => router.push('/login')}><Text style={styles.buttonText}>Sign in</Text></Pressable></>}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, container: { padding: 20 }, title: { fontSize: 30, fontWeight: '800' }, subtitle: { marginTop: 10, fontSize: 16, lineHeight: 23, opacity: 0.6 }, profile: { marginTop: 24, padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }, avatar: { fontSize: 32, marginRight: 14 }, label: { fontSize: 12, opacity: 0.5 }, email: { marginTop: 4, fontSize: 16, fontWeight: '700' }, button: { marginTop: 18, padding: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#1F2933' }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' } });
