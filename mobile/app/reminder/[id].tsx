import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { cancelReminderNotifications } from '../../lib/notifications';

const C = { green:'#174D3F', greenDark:'#103D32', gold:'#D9A93A', cream:'#F7F5F0', white:'#FFFFFF', muted:'#7B817D', line:'#E4E0D7', soft:'#EAF2EE', red:'#A33A2B' };
type Reminder = { id:string; title:string; description:string|null; reminder_type:string; due_at:string; recurrence_rule:string|null; remind_before_minutes:number; status:string; enabled:boolean };

function advanceRecurringDate(value:string, rule:string, now:Date){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
 const match=rule.match(/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(?:;INTERVAL=(\d+))?$/);if(!match)return null;
 const frequency=match[1],interval=Math.max(1,Number(match[2]??'1'));
 const addOne=(d:Date)=>{if(frequency==='DAILY')d.setDate(d.getDate()+interval);else if(frequency==='WEEKLY')d.setDate(d.getDate()+7*interval);else if(frequency==='MONTHLY'){const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+interval);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));}else{const month=d.getMonth(),day=d.getDate();d.setDate(1);d.setFullYear(d.getFullYear()+interval);d.setMonth(month);const last=new Date(d.getFullYear(),month+1,0).getDate();d.setDate(Math.min(day,last));}};
 let guard=0;while(date<=now&&guard<1000){addOne(date);guard++;}return date>now?date.toISOString():null;
}

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams<{ id:string }>();
  const [item,setItem] = useState<Reminder|null>(null); const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const load = useCallback(async () => { if (!id) return; const { data, error: queryError } = await supabase.from('reminders').select('id,title,description,reminder_type,due_at,recurrence_rule,remind_before_minutes,status,enabled').eq('id',id).single(); if (queryError) setError(queryError.message); else setItem(data as Reminder); setLoading(false); },[id]);
  useEffect(() => { void load(); },[load]);

  async function markDone() {
    if (!id) return; setBusy(true); setError('');
    const { data: current, error: loadError } = await supabase.from('reminders').select('id,user_id,horse_id,title,description,reminder_type,due_at,recurrence_rule,remind_before_minutes,status,enabled').eq('id',id).eq('status','pending').eq('enabled',true).single();
    if (loadError || !current) { setBusy(false); return setError(loadError?.message || 'This reminder is no longer active.'); }
    if (current.recurrence_rule) {
      const nextDue=advanceRecurringDate(current.due_at,current.recurrence_rule,new Date());
      if(!nextDue){setBusy(false);return setError('Unable to calculate the next occurrence.');}
      const { data: existingNext, error: existingError } = await supabase.from('reminders').select('id').eq('source_id',id).eq('status','pending').eq('enabled',true).maybeSingle();
      if(existingError){setBusy(false);return setError(existingError.message);}
      if(!existingNext){
        const { error: insertError } = await supabase.from('reminders').insert({ user_id:current.user_id,horse_id:current.horse_id,title:current.title,description:current.description,reminder_type:current.reminder_type,due_at:nextDue,recurrence_rule:current.recurrence_rule,remind_before_minutes:current.remind_before_minutes,status:'pending',enabled:true,auto_generated:true,source_type:'recurring_reminder',source_id:id,rule_key:current.recurrence_rule });
        if(insertError){setBusy(false);return setError(insertError.message);}
      }
    }
    const { error: updateError } = await supabase.from('reminders').update({ status:'completed', enabled:false, completed_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',id).eq('status','pending');
    if (updateError) { setBusy(false); return setError(updateError.message); }
    await cancelReminderNotifications(id); setBusy(false); router.replace('/(tabs)/reminders');
  }

  async function remove() { if (!id) return; setBusy(true); setError(''); const { error: deleteError } = await supabase.from('reminders').delete().eq('id',id); if (deleteError) { setBusy(false); return setError(deleteError.message); } await cancelReminderNotifications(id); setBusy(false); router.replace('/(tabs)/reminders'); }
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.green}/><Text style={styles.muted}>Loading reminder…</Text></View>;
  if (!item) return <SafeAreaView style={styles.safe}><View style={styles.container}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.arrow}>‹</Text><Text style={styles.backText}>Back</Text></Pressable><View style={styles.error}><Text style={styles.errorText}>{error || 'Reminder not found.'}</Text></View></View></SafeAreaView>;
  const due = new Date(item.due_at); const date = due.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'}); const time = due.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}><View style={styles.top}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.arrow}>‹</Text><Text style={styles.backText}>Back</Text></Pressable><Pressable onPress={()=>router.push({pathname:'/edit-reminder/[id]',params:{id}})} style={styles.edit}><Text style={styles.editText}>Edit</Text></Pressable></View><Text style={styles.kicker}>{item.reminder_type.replaceAll('_',' ').toUpperCase()}</Text><Text style={styles.title}>{item.title}</Text><View style={styles.dateCard}><Text style={styles.date}>{date}</Text><Text style={styles.time}>{time}</Text><Text style={styles.lead}>Reminder: {item.remind_before_minutes === 0 ? 'at due time' : `${item.remind_before_minutes} minutes before`}</Text></View>{item.description ? <View style={styles.section}><Text style={styles.label}>NOTES</Text><Text style={styles.body}>{item.description}</Text></View> : null}{item.recurrence_rule ? <View style={styles.section}><Text style={styles.label}>REPEAT</Text><Text style={styles.body}>{item.recurrence_rule}</Text></View> : null}{error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}<Pressable disabled={busy} onPress={() => void markDone()} style={({pressed})=>[styles.done,pressed&&styles.pressed,busy&&styles.disabled]}><Text style={styles.doneText}>{busy ? 'Saving…' : '✓ Mark as completed'}</Text></Pressable><Pressable disabled={busy} onPress={() => void remove()} style={({pressed})=>[styles.delete,pressed&&styles.pressed,busy&&styles.disabled]}><Text style={styles.deleteText}>Delete reminder</Text></Pressable></ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:C.cream},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.cream},container:{padding:20,paddingBottom:44},muted:{marginTop:8,color:C.muted},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start',paddingVertical:6},arrow:{color:C.green,fontSize:32,lineHeight:30},backText:{marginLeft:5,color:C.green,fontSize:15,fontWeight:'800'},edit:{paddingHorizontal:15,paddingVertical:10,borderRadius:12,backgroundColor:C.soft},editText:{color:C.green,fontSize:13,fontWeight:'900'},kicker:{marginTop:20,color:C.gold,fontSize:12,fontWeight:'900',letterSpacing:2},title:{marginTop:7,color:C.green,fontSize:34,lineHeight:40,fontWeight:'900'},dateCard:{marginTop:22,padding:20,borderRadius:22,backgroundColor:C.green},date:{color:C.white,fontSize:16,fontWeight:'800'},time:{marginTop:7,color:C.gold,fontSize:34,fontWeight:'900'},lead:{marginTop:8,color:'#D9E4DF',fontSize:13,fontWeight:'600'},section:{marginTop:22,padding:18,borderRadius:18,backgroundColor:C.white,borderWidth:1,borderColor:C.line},label:{color:C.green,fontSize:11,fontWeight:'900',letterSpacing:1.5},body:{marginTop:8,color:C.muted,fontSize:15,lineHeight:22},done:{marginTop:24,minHeight:58,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:C.gold},doneText:{color:C.greenDark,fontSize:16,fontWeight:'900'},delete:{marginTop:10,minHeight:52,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#E3C9C5'},deleteText:{color:C.red,fontSize:14,fontWeight:'800'},error:{marginTop:16,padding:13,borderRadius:13,backgroundColor:'#F6E9E6'},errorText:{color:C.red,fontSize:13,lineHeight:19,fontWeight:'600'},pressed:{opacity:0.82},disabled:{opacity:0.45}});