import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function signIn() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setMessage(error.message);
    } else {
      router.replace('/(tabs)');
    }
    setBusy(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Back</Text></Pressable>
        <Text style={styles.brand}>SHABDIZ</Text>
        <Text style={styles.platform}>Equestrian Platform</Text>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome{`\n`}back</Text>
          <Text style={styles.subtitle}>Sign in to access your horses, training, marketplace and intelligent tools.</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#969B98"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              placeholder="Your password"
              placeholderTextColor="#969B98"
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              <Text style={styles.show}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable
            disabled={busy || !email.trim() || !password}
            onPress={() => void signIn()}
            style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || !email.trim() || !password) && styles.disabled]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>
          <Pressable onPress={() => {}}><Text style={styles.forgot}>Forgot your password?</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { flex: 1, padding: 20 },
  back: { fontSize: 18, fontWeight: '700', color: '#171A19' },
  brand: { marginTop: 48, fontSize: 42, fontWeight: '900', letterSpacing: 3, color: '#0E5A45' },
  platform: { marginTop: 2, fontSize: 18, fontWeight: '600', color: '#777D79' },
  card: { marginTop: 28, padding: 28, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E3DE' },
  title: { fontSize: 42, lineHeight: 48, fontWeight: '900', color: '#111312' },
  subtitle: { marginTop: 16, fontSize: 17, lineHeight: 25, fontWeight: '600', color: '#777D79' },
  label: { marginTop: 25, marginBottom: 9, fontSize: 17, fontWeight: '900', color: '#171A19' },
  input: { minHeight: 58, paddingHorizontal: 18, borderRadius: 15, borderWidth: 1.5, borderColor: '#D9DAD6', backgroundColor: '#FCFCFB', fontSize: 17, fontWeight: '600', color: '#171A19' },
  passwordRow: { minHeight: 58, paddingLeft: 18, paddingRight: 16, borderRadius: 15, borderWidth: 1.5, borderColor: '#D9DAD6', backgroundColor: '#FCFCFB', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, fontSize: 17, fontWeight: '600', color: '#171A19' },
  show: { marginLeft: 10, fontSize: 17, fontWeight: '900', color: '#0E5A45' },
  message: { marginTop: 12, fontSize: 14, lineHeight: 20, color: '#9A3D36' },
  button: { marginTop: 22, minHeight: 60, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E5A45' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  forgot: { marginTop: 22, textAlign: 'center', fontSize: 17, fontWeight: '900', color: '#0E5A45' },
});
