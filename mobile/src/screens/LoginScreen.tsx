import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';
import { supabase } from '../lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError(null);
    if (!supabase) {
      setError('Supabase is not configured for the mobile app.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>SHABDIZ</Text>
      <Text style={styles.platform}>Equestrian Platform</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome{`\n`}back</Text>
        <Text style={styles.description}>Sign in to access your horses, training, marketplace and intelligent tools.</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.muted} style={styles.input} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={signIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
        <Text style={styles.forgot}>Forgot your password?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 48 },
  brand: { color: colors.primary, fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  platform: { color: colors.muted, fontSize: 18, marginTop: 2, marginBottom: 28 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 28 },
  title: { color: colors.text, fontSize: 50, lineHeight: 55, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 18, lineHeight: 29, marginTop: 18, marginBottom: 28 },
  label: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  input: { height: 58, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: 18, fontSize: 17, color: colors.text, marginBottom: 20 },
  button: { backgroundColor: colors.primary, borderRadius: radius.button, height: 62, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  forgot: { color: colors.primary, textAlign: 'center', fontSize: 17, fontWeight: '800', marginTop: 24 },
  error: { color: '#B42318', marginBottom: 12 },
});
