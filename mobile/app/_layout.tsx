import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { getNativePushToken } from '../lib/notifications';
import { saveMobileDevice } from '../lib/mobileDevice';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    let mounted = true;

    const register = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session) return;
      const token = await getNativePushToken();
      if (mounted && token) await saveMobileDevice(token);
    };

    void register();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void register();
    });

    const notificationListener = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/calendar');
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      notificationListener.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F5F0' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
