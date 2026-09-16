import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

function decode(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function paramsFromUrl(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const read = (source: string) => Object.fromEntries(source.split('&').filter(Boolean).map(part => {
    const [k, ...rest] = part.split('=');
    return [decode(k), decode(rest.join('='))];
  }));
  return { ...read(query), ...read(fragment) };
}

export default function AuthCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const handle = async (url: string | null) => {
      if (!url) return;
      const p = paramsFromUrl(url);
      try {
        if (p.access_token && p.refresh_token) {
          const result = await supabase.auth.setSession({ access_token: p.access_token, refresh_token: p.refresh_token });
          if (result.error) throw result.error;
        } else if (p.token_hash) {
          const result = await supabase.auth.verifyOtp({ token_hash: p.token_hash, type: (p.type || 'email') as 'email' });
          if (result.error) throw result.error;
        } else {
          throw new Error('The sign-in link is missing its authentication token.');
        }
        if (mounted) router.replace('/(tabs)');
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Unable to complete sign in.');
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', event => { void handle(event.url); });
    return () => { mounted = false; sub.remove(); };
  }, []);

  return (
    <View style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
        <Text style={styles.brand}>SHABDIZ</Text>
        {error ? <><Text style={styles.title}>Sign-in link expired</Text><Text style={styles.body}>{error}</Text></> : <><ActivityIndicator size="large" color="#D9A93A" /><Text style={styles.title}>Signing you in…</Text><Text style={styles.body}>Please wait while we securely connect your account.</Text></>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, padding: 30, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', borderWidth: 1, borderColor: '#E7E3DA' },
  mark: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: '#D9A93A', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#D9A93A', fontSize: 29, fontWeight: '900' },
  brand: { marginTop: 12, color: '#174D3F', fontSize: 24, letterSpacing: 3, fontWeight: '900' },
  title: { marginTop: 24, color: '#174D3F', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { marginTop: 9, color: '#7B817D', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
