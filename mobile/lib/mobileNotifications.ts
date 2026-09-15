import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerCurrentDevice(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted'
    ? current
    : await Notifications.requestPermissionsAsync();

  if (permission.status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS projectId is not configured');

  const address = await Notifications.getExpoPushTokenAsync({ projectId });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from('mobile_devices').upsert({
    user_id: user.id,
    platform: Platform.OS,
    external_id: address.data,
    app_version: Constants.expoConfig?.version ?? null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'user_id,external_id' });

  if (error) throw error;
  return address.data;
}

export async function scheduleLocalReminderTest(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'EquiMaster Pro',
      body: 'Native mobile notifications are enabled.',
      data: { screen: 'reminders' },
    },
    trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
}
