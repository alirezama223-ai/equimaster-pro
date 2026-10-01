import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getNativePushToken() {
  if (Platform.OS === 'web') return null;

  const permissions = await Notifications.getPermissionsAsync();
  const status = permissions.status === 'granted'
    ? permissions.status
    : (await Notifications.requestPermissionsAsync()).status;

  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const result = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return result.data;
}

export type ReminderNotificationInput = {
  id: string;
  title: string;
  description?: string | null;
  due_at: string;
  remind_before_minutes: number;
  recurrence_rule?: string | null;
  enabled?: boolean;
  status?: string;
};

async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function nextOccurrence(date: Date, rule: string | null | undefined) {
  if (!rule) return null;
  const next = new Date(date);
  const freq = rule.match(/FREQ=([A-Z]+)/)?.[1];
  const interval = Number(rule.match(/INTERVAL=(\d+)/)?.[1] ?? '1');
  if (freq === 'DAILY') next.setDate(next.getDate() + interval);
  else if (freq === 'WEEKLY') next.setDate(next.getDate() + 7 * interval);
  else if (freq === 'MONTHLY') next.setMonth(next.getMonth() + interval);
  else if (freq === 'YEARLY') next.setFullYear(next.getFullYear() + interval);
  else return null;
  return next;
}

export async function cancelReminderNotifications(reminderId: string) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.reminderId === reminderId)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

export async function scheduleReminderNotifications(reminder: ReminderNotificationInput) {
  if (Platform.OS === 'web' || reminder.enabled === false || reminder.status === 'completed') return;
  if (!(await ensureNotificationPermission())) return;

  await cancelReminderNotifications(reminder.id);

  const due = new Date(reminder.due_at);
  if (Number.isNaN(due.getTime())) return;

  let occurrence: Date | null = due;
  let scheduledCount = 0;
  // Keep a rolling local queue. It is refreshed whenever the Reminders screen opens.
  while (occurrence && scheduledCount < 30) {
    const fireAt = new Date(occurrence.getTime() - reminder.remind_before_minutes * 60_000);
    if (fireAt.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'EquiMaster Pro Reminder',
          body: reminder.title + (reminder.description ? ` — ${reminder.description}` : ''),
          sound: 'default',
          data: { reminderId: reminder.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: 'reminders' },
      });
      scheduledCount += 1;
    }
    occurrence = nextOccurrence(occurrence, reminder.recurrence_rule);
  }
}

export async function syncReminderNotifications(reminders: ReminderNotificationInput[]) {
  if (Platform.OS === 'web') return;
  if (!(await ensureNotificationPermission())) return;

  for (const reminder of reminders) {
    await scheduleReminderNotifications(reminder);
  }
}
