import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function saveMobileDevice(token: string) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const platform = Platform.OS;
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const { data: existing } = await supabase
    .from('mobile_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('external_id', token)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('mobile_devices')
      .update({ app_version: version, last_seen_at: new Date().toISOString() })
      .eq('id', existing.id);
    return;
  }

  await supabase.from('mobile_devices').insert({
    user_id: userId,
    platform,
    external_id: token,
    app_version: version,
    last_seen_at: new Date().toISOString(),
  });
}
