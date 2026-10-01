import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const C = { green: '#174D3F', greenDark: '#103D32', gold: '#D9A93A', cream: '#F7F5F0', white: '#FFFFFF', muted: '#7B817D', line: '#E4E0D7', soft: '#EAF2EE', red: '#A33A2B' };
const TYPES = [
  ['vaccination', 'Vaccination'],
  ['farrier', 'Farrier'],
  ['veterinary', 'Veterinary'],
  ['deworming', 'Deworming'],
  ['dental', 'Dental'],
  ['training', 'Training'],
  ['competition', 'Competition'],
  ['other', 'Other'],
] as const;
const LEADS = [[0, 'At due time'], [60, '1 hour before'], [1440, '1 day before'], [10080, '7 days before'], [43200, '30 days before']] as const;
const REPEATS = [['none', 'Does not repeat'], ['weekly', 'Every week'], ['monthly', 'Every month'], ['yearly', 'Every year']] as const;

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddReminderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('vaccination');
  const [date, setDate] = useState(addDays(7));
  const [time, setTime] = useState('09:00');
  const [lead, setLead] = useState(1440);
  const [repeat, setRepeat] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isoDue = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    const tm = /^(\d{2}):(\d{2})$/.exec(time.trim());
    if (!match || !tm) return null;
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
    const hour = Number(tm[1]); const minute = Number(tm[2]);
    const d = new Date(year, month - 1, day, hour, minute, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }, [date, time]);

  async function save() {
    setError('');
    if (!title.trim()) return setError('Please enter a reminder title.');
    if (!isoDue) return setError('Use a valid date (YYYY-MM-DD) and time (HH:MM).');
    if (new Date(isoDue).getTime() <= Date.now()) return setError('The reminder date must be in the future.');
    setBusy(true);

    const { error: insertError } = await supabase.from('reminders').insert({
      title: title.trim(),
      description: description.trim() || null,
      reminder_type: type,
      due_at: isoDue,
      recurrence_rule: repeat === 'none' ? null : repeat,
      remind_before_minutes: lead,
      status: 'pending',
      enabled: true,
    });

    setBusy(false);
    if (insertError) return setError(insertError.message);
    router.replace('/(tabs)/reminders');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Back</Text></Pressable>
          <Text style={styles.kicker}>EQUIMASTER PRO</Text>
          <Text style={styles.title}>New reminder</Text>
          <Text style={styles.subtitle}>Keep vaccinations, farrier visits, veterinary care and stable tasks on schedule.</Text>

          <View style={styles.panel}>
            <Label text="TITLE" />
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Annual vaccination — Shabdiz" placeholderTextColor="#A5AAA6" style={styles.input} />

            <Label text="TYPE" />
            <View style={styles.chips}>{TYPES.map(([value, label]) => <Chip key={value} label={label} active={type === value} onPress={() => setType(value)} />)}</View>

            <Label text="DATE" />
            <TextInput value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="YYYY-MM-DD" placeholderTextColor="#A5AAA6" style={styles.input} />
            <View style={styles.quickRow}>{[1, 7, 30].map((days) => <QuickButton key={days} text={`+${days} days`} onPress={() => setDate(addDays(days))} />)}</View>

            <Label text="TIME" />
            <TextInput value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="09:00" placeholderTextColor="#A5AAA6" style={styles.input} />

            <Label text="REMIND ME" />
            <View style={styles.chips}>{LEADS.map(([value, label]) => <Chip key={value} label={label} active={lead === value} onPress={() => setLead(value)} />)}</View>

            <Label text="REPEAT" />
            <View style={styles.chips}>{REPEATS.map(([value, label]) => <Chip key={value} label={label} active={repeat === value} onPress={() => setRepeat(value)} />)}</View>

            <Label text="NOTES (OPTIONAL)" />
            <TextInput value={description} onChangeText={setDescription} placeholder="Add any useful details…" placeholderTextColor="#A5AAA6" multiline numberOfLines={4} style={[styles.input, styles.notes]} />

            {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
            <Pressable disabled={busy} onPress={() => void save()} style={({ pressed }) => [styles.save, pressed && styles.pressed, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color={C.greenDark} /> : <Text style={styles.saveText}>Create reminder</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function QuickButton({ text, onPress }: { text: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}><Text style={styles.quickText}>{text}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.cream},flex:{flex:1},container:{padding:20,paddingBottom:44},back:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start',paddingVertical:6},backArrow:{color:C.green,fontSize:32,lineHeight:30},backText:{marginLeft:5,color:C.green,fontSize:15,fontWeight:'800'},kicker:{marginTop:20,color:C.gold,fontSize:12,fontWeight:'900',letterSpacing:2.2},title:{marginTop:7,color:C.green,fontSize:36,lineHeight:42,fontWeight:'900'},subtitle:{marginTop:8,color:C.muted,fontSize:15,lineHeight:22},panel:{marginTop:22,padding:20,borderRadius:24,backgroundColor:C.white,borderWidth:1,borderColor:C.line},label:{marginTop:18,marginBottom:8,color:C.green,fontSize:11,letterSpacing:1.5,fontWeight:'900'},input:{minHeight:56,paddingHorizontal:15,borderRadius:15,borderWidth:1,borderColor:C.line,backgroundColor:'#FAFAF8',color:C.green,fontSize:15},notes:{paddingTop:14,minHeight:100,textAlignVertical:'top'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:13,borderWidth:1,borderColor:C.line,backgroundColor:'#FAFAF8'},chipActive:{borderColor:C.green,backgroundColor:C.soft},chipText:{color:C.muted,fontSize:12,fontWeight:'700'},chipTextActive:{color:C.green},quickRow:{marginTop:8,flexDirection:'row',gap:8},quick:{paddingHorizontal:12,paddingVertical:9,borderRadius:11,backgroundColor:C.soft},quickText:{color:C.green,fontSize:12,fontWeight:'800'},error:{marginTop:16,padding:13,borderRadius:13,backgroundColor:'#F6E9E6'},errorText:{color:C.red,fontSize:13,lineHeight:19,fontWeight:'600'},save:{marginTop:18,minHeight:58,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:C.gold},saveText:{color:C.greenDark,fontSize:16,fontWeight:'900'},pressed:{opacity:0.82},disabled:{opacity:0.45}
});