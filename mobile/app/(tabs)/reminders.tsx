import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { syncReminderNotifications } from '../../lib/notifications';

type Reminder = { id:string; title:string; description:string|null; reminder_type:string; due_at:string; recurrence_rule:string|null; remind_before_minutes:number; status:string; enabled:boolean; horse_id:string|null; horse_name?:string|null };

function advanceRecurringDate(value:string,rule:string,now:Date){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
 const match=rule.match(/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(?:;INTERVAL=(\d+))?$/);if(!match)return null;
 const frequency=match[1],interval=Math.max(1,Number(match[2]??'1'));
 const addOne=()=>{if(frequency==='DAILY')date.setDate(date.getDate()+interval);else if(frequency==='WEEKLY')date.setDate(date.getDate()+7*interval);else if(frequency==='MONTHLY'){const day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+interval);const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();date.setDate(Math.min(day,last));}else{const month=date.getMonth(),day=date.getDate();date.setDate(1);date.setFullYear(date.getFullYear()+interval);date.setMonth(month);const last=new Date(date.getFullYear(),month+1,0).getDate();date.setDate(Math.min(day,last));}};
 let guard=0;while(date<=now&&guard<1000){addOne();guard++;}return date>now?date.toISOString():null;
}

export default function RemindersTab(){
 const[items,setItems]=useState<Reminder[]>([]);const[loading,setLoading]=useState(true);const[refreshing,setRefreshing]=useState(false);const[error,setError]=useState<string|null>(null);
 const load=useCallback(async(pull=false)=>{if(pull)setRefreshing(true);else setLoading(true);setError(null);
  const now=new Date();
  const{data,error:queryError}=await supabase.from('reminders').select('id,title,description,reminder_type,due_at,recurrence_rule,remind_before_minutes,status,enabled,horse_id').eq('status','pending').eq('enabled',true).order('due_at',{ascending:true});
  if(queryError){setError(queryError.message);setLoading(false);setRefreshing(false);return;}
  const reminders:Reminder[]=[];
  for(const raw of (data??[]) as Reminder[]){const due=new Date(raw.due_at);if(due>now){reminders.push(raw);continue;}if(raw.recurrence_rule){const nextDue=advanceRecurringDate(raw.due_at,raw.recurrence_rule,now);if(nextDue){const{error}=await supabase.from('reminders').update({due_at:nextDue,updated_at:new Date().toISOString()}).eq('id',raw.id).eq('status','pending').eq('enabled',true);if(!error)reminders.push({...raw,due_at:nextDue});}}}
  reminders.sort((a,b)=>new Date(a.due_at).getTime()-new Date(b.due_at).getTime());
  const ids=[...new Set(reminders.map(r=>r.horse_id).filter(Boolean))] as string[];
  if(ids.length){const[{data:personal},{data:listings}]=await Promise.all([supabase.from('personal_horses').select('id,name').in('id',ids),supabase.from('horse_listings').select('id,name').in('id',ids)]);const names=new Map<string,string>();for(const h of personal??[])names.set(h.id,h.name);for(const h of listings??[])names.set(h.id,h.name);for(const r of reminders)r.horse_name=r.horse_id?names.get(r.horse_id)??null:null;}
  setItems(reminders);try{await syncReminderNotifications(reminders);}catch(notificationError){console.warn('Reminder notification sync failed',notificationError);}setLoading(false);setRefreshing(false);
 },[]);
 useEffect(()=>{void load();},[load]);
 if(loading)return <View style={styles.center}><ActivityIndicator size="large"/><Text style={styles.muted}>Loading reminders…</Text></View>;
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>void load(true)}/>}
 ><View style={styles.headerRow}><View style={styles.headerCopy}><Text style={styles.eyebrow}>EQUIMASTER PRO</Text><Text style={styles.title}>Reminders</Text><Text style={styles.subtitle}>Your next stable tasks, ready to act on.</Text></View><Pressable style={({pressed})=>[styles.addButton,pressed&&styles.pressed]} onPress={()=>router.push('/add-reminder')}><Text style={styles.addButtonText}>+ Add</Text></Pressable></View>
 {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
 {items.length===0?<View style={styles.empty}><Text style={styles.emptyIcon}>🔔</Text><Text style={styles.emptyTitle}>No active reminders</Text><Text style={styles.muted}>Add a vaccination, farrier visit, veterinary check, training session or competition reminder.</Text><Pressable style={({pressed})=>[styles.emptyButton,pressed&&styles.pressed]} onPress={()=>router.push('/add-reminder')}><Text style={styles.emptyButtonText}>Create first reminder</Text></Pressable></View>:<View style={styles.list}>{items.map(item=><ReminderCard key={item.id} reminder={item}/>)}</View>}
 </ScrollView></SafeAreaView>;
}
function ReminderCard({reminder}:{reminder:Reminder}){const due=new Date(reminder.due_at);const date=due.toLocaleDateString(undefined,{day:'2-digit',month:'short'});const time=due.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});return <Pressable style={({pressed})=>[styles.card,pressed&&styles.pressed]} onPress={()=>router.push({pathname:'/reminder/[id]',params:{id:reminder.id}})}><View style={styles.cardTop}><Text style={styles.type}>{reminder.reminder_type.replaceAll('_',' ')}</Text><Text style={styles.when}>{date} · {time}</Text></View><Text style={styles.cardTitle}>{reminder.title}{reminder.horse_name?` · ${reminder.horse_name}`:''}</Text>{reminder.description?<Text style={styles.cardBody} numberOfLines={2}>{reminder.description}</Text>:null}<View style={styles.cardBottom}><Text style={styles.lead}>Notify {reminder.remind_before_minutes} min before</Text>{reminder.recurrence_rule?<Text style={styles.repeat}>{reminder.recurrence_rule}</Text>:null}</View></Pressable>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F5F0'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F5F0'},container:{padding:20,paddingBottom:40},headerRow:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:14},headerCopy:{flex:1},eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:2,opacity:.55},title:{marginTop:10,fontSize:32,fontWeight:'800'},subtitle:{marginTop:8,fontSize:15,lineHeight:21,opacity:.6},addButton:{marginTop:4,paddingHorizontal:16,paddingVertical:11,borderRadius:14,backgroundColor:'#1F2933'},addButtonText:{color:'#FFFFFF',fontSize:14,fontWeight:'800'},list:{marginTop:22,gap:12},card:{padding:17,borderRadius:19,backgroundColor:'#FFFFFF'},pressed:{opacity:.8,transform:[{scale:.99}]},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:12},type:{fontSize:11,fontWeight:'800',textTransform:'uppercase',opacity:.5},when:{fontSize:12,fontWeight:'700',opacity:.65},cardTitle:{marginTop:10,fontSize:18,fontWeight:'800'},cardBody:{marginTop:7,fontSize:14,lineHeight:20,opacity:.62},cardBottom:{marginTop:13,flexDirection:'row',justifyContent:'space-between',gap:8},lead:{fontSize:12,fontWeight:'700',opacity:.52},repeat:{fontSize:12,fontWeight:'700',opacity:.52},empty:{marginTop:28,padding:30,borderRadius:22,backgroundColor:'#FFFFFF',alignItems:'center'},emptyIcon:{fontSize:34},emptyTitle:{marginTop:12,fontSize:20,fontWeight:'800'},muted:{marginTop:7,fontSize:14,lineHeight:20,textAlign:'center',opacity:.6},emptyButton:{marginTop:18,paddingHorizontal:18,paddingVertical:12,borderRadius:14,backgroundColor:'#1F2933'},emptyButtonText:{color:'#FFFFFF',fontSize:14,fontWeight:'800'},error:{marginTop:18,padding:14,borderRadius:14,backgroundColor:'#FCECEC'},errorText:{fontSize:13,lineHeight:18}});
