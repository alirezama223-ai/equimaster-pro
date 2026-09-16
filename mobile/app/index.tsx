import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) return <View style={styles.center}><ActivityIndicator size="large" color="#D9A93A" /></View>;
  return <Redirect href={signedIn ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0' },
});
