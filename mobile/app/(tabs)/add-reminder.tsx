import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { scheduleReminderNotification } from '../../../lib/notifications';

const TYPES = ['Vaccination', 'Farrier', 'Veterinary', 'Training', 'Competition', 'Other'];
const LEADS = [0, 60, 1440, 2880, 10080];
type Horse = { id: string; name: string };

export default function AddReminderScreen() {
  const params = useLocalSearchParams<{ horseId?: string }>();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseId, setHorseId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Veterinary');
  const [date, setDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  const [time, setTime] = useState('10:00');
  const [lead, setLead] = useState(1440);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHorses() {
      const { data } = await supabase.from('horse_listings').select('id,name').order('name');
      const rows = (data ?? []) as Horse[];
      setHorses(rows);
      if (params.horseId && rows.some((horse) => horse.id === params.horseId)) setHorseId(params.horseId);
    }
    void loadHorses();
  }, [params.horseId]);

  async function save() {
    setError(null);
    if (!title.trim()) { setError('Please enter a reminder title.'); return; }
    const due = new Date(`${date}T${time}:00`);
    if (Number.isNaN(due.getTime())) { setError('Please use date YYYY-MM-DD and time HH:MM.'); return; }
    if (due.getTime() <= Date.now()) { setError('Please choose a future date and time.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please sign in first.'); setSaving(false); return; }
    const { data, error: insertError } = await supabase.from('reminders').insert({
      user_id: user.id, horse_id: horseId || null, title: title.trim(), description: description.trim() || null,
      reminder_type: type.toLowerCase().replaceAll(' ', '_'), due_at: due.toISOString(), remind_before_minutes: lead, status: 'pending', enabled: true,
    }).select('id,title,description,reminder_type,due_at,remind_before_minutes').single();
    if (insertError) { setError(insertError.message); setSaving(false); return; }
    let notificationError: string | null = null;
    try { await scheduleReminderNotification(data); } catch (e) { notificationError = e instanceof Error ? e.message : 'Saved, but notification could not be scheduled.'; }
    setSaving(false);
    if (notificationError) setError(notificationError);
    router.replace('/(tabs)/reminders');
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Reminders</Text></Pressable>
    <Text style={styles.brand}>SHABDIZ</Text><Text style={styles.title}>Add Reminder</Text><Text style={styles.subtitle}>Never miss an important stable task.</Text>
    <View style={styles.card}>
      <Text style={styles.label}>Horse</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable onPress={() => setHorseId('')} style={[styles.chip, !horseId && styles.active]}><Text style={[styles.chipText, !horseId && styles.activeText]}>General</Text></Pressable>
        {horses.map((horse) => <Pressable key={horse.id} onPress={() => setHorseId(horse.id)} style={[styles.chip, horse.id === horseId && styles.active]}><Text style={[styles.chipText, horse.id === horseId && styles.activeText]}>{horse.name}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.label}>Title</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="e.g. Annual vaccination" />
      <Text style={styles.label}>Type</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{TYPES.map((item) => <Pressable key={item} onPress={() => setType(item)} style={[styles.chip, item === type && styles.active]}><Text style={[styles.chipText, item === type && styles.activeText]}>{item}</Text></Pressable>)}</ScrollView>
      <View style={styles.row}><View style={styles.half}><Text style={styles.label}>Date</Text><TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="YYYY-MM-DD" /></View><View style={styles.half}><Text style={styles.label}>Time</Text><TextInput value={time} onChangeText={setTime} style={styles.input} placeholder="HH:MM" /></View></View>
      <Text style={styles.label}>Notify me</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{LEADS.map((minutes) => { const text = minutes === 0 ? 'At time' : minutes < 1440 ? `${minutes / 60}h before` : `${minutes / 1440}d before`; return <Pressable key={minutes} onPress={() => setLead(minutes)} style={[styles.chip, lead === minutes && styles.active]}><Text style={[styles.chipText, lead === minutes && styles.activeText]}>{text}</Text></Pressable>; })}</ScrollView>
      <Text style={styles.label}>Notes</Text><TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.notes]} placeholder="Optional details" multiline />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={saving} onPress={save} style={styles.button}><Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save reminder 🔔'}</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F5F0'},content:{padding:20,paddingBottom:50},back:{color:'#0E5A45',fontWeight:'800',marginBottom:14},brand:{fontSize:30,fontWeight:'900',letterSpacing:2.5,color:'#0E5A45'},title:{marginTop:16,fontSize:32,fontWeight:'900'},subtitle:{marginTop:5,marginBottom:20,fontSize:15,lineHeight:22,color:'#777D79'},card:{backgroundColor:'#FFF',borderRadius:22,padding:18,borderWidth:1,borderColor:'#E1DFD9'},label:{marginTop:10,marginBottom:6,fontSize:12,fontWeight:'800',color:'#777D79'},input:{minHeight:46,borderWidth:1,borderColor:'#DCD9D1',borderRadius:13,paddingHorizontal:12,backgroundColor:'#FAFAF8',fontSize:15},row:{flexDirection:'row',gap:10},half:{flex:1},chips:{gap:8},chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:16,backgroundColor:'#F1EFE9'},active:{backgroundColor:'#0E5A45'},chipText:{fontWeight:'800',color:'#555C58'},activeText:{color:'#FFF'},notes:{minHeight:90,paddingTop:12,textAlignVertical:'top'},button:{marginTop:17,minHeight:50,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#0E5A45'},buttonText:{color:'#FFF',fontWeight:'900',fontSize:15},error:{marginTop:12,color:'#A33A2B',lineHeight:20}});
