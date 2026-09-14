import { createClient } from "@/app/lib/supabase/client";

export type PushPermissionResult = {
  supported: boolean;
  enabled: boolean;
  reason?: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function enablePushNotifications(): Promise<PushPermissionResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { supported: false, enabled: false, reason: "Push notifications are not supported by this browser." };
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { supported: true, enabled: false, reason: "Push notifications are not configured." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { supported: true, enabled: false, reason: "Notification permission was not granted." };

  const registration = await navigator.serviceWorker.register("/sw.js");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) throw new Error("Invalid push subscription returned by browser.");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supported: true, enabled: false, reason: "You must be signed in to enable reminders." };

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) throw error;
  return { supported: true, enabled: true };
}

export async function disablePushNotifications() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  const supabase = createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  await subscription.unsubscribe();
}
