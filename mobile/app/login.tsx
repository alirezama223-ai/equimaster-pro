import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function sendLink() {
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: 'equimaster://login' },
    });
    if (error) setMessage(error.message);
    else setMessage('Check your email for the secure sign-in link.');
    setBusy(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => router.back()}><Text style={styles.close}>‹ Close</Text></Pressable>
        <Text style={styles.logo}>EQUIMASTER PRO</Text>
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>Enter your email and we will send you a secure sign-in link.</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable disabled={busy || !email.trim()} onPress={sendLink} style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || !email.trim()) && styles.disabled]}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send secure link</Text>}</Pressable>
        <View style={styles.note}><Text style={styles.noteIcon}>🔐</Text><Text style={styles.noteText}>No local credentials are stored by the app. Your session is kept securely on the device.</Text></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, container: { flex: 1, padding: 20 }, close: { fontSize: 16, fontWeight: '700', opacity: 0.6 }, logo: { marginTop: 55, fontSize: 11, fontWeight: '800', letterSpacing: 2, opacity: 0.5 }, title: { marginTop: 10, fontSize: 34, lineHeight: 40, fontWeight: '800' }, subtitle: { marginTop: 10, fontSize: 16, lineHeight: 23, opacity: 0.58 }, input: { marginTop: 18, minHeight: 54, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#FFFFFF', fontSize: 16 }, message: { marginTop: 12, lineHeight: 20, fontSize: 14, opacity: 0.72 }, button: { marginTop: 18, minHeight: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F2933' }, pressed: { opacity: 0.82 }, disabled: { opacity: 0.4 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, note: { marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row' }, noteIcon: { fontSize: 22, marginRight: 10 }, noteText: { flex: 1, fontSize: 13, lineHeight: 19, opacity: 0.58 } });
