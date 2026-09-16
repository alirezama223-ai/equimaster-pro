import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { getNativePushToken } from '../lib/notifications';
import { saveMobileDevice } from '../lib/mobileDevice';
import { supabase } from '../lib/supabase';

function openNotification(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const data = response.notification.request.content.data as { route?: string; reminderId?: string } | undefined;
  if (data?.reminderId) {
    router.push(`/(tabs)/reminder/${data.reminderId}`);
    return;
  }
  if (data?.route) {
    router.push(data.route as never);
    return;
  }
  router.push('/(tabs)/calendar');
}

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

    const notificationListener = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (mounted) openNotification(response);
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
