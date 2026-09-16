import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:true})});

async function ensurePermission(){
 const permissions=await Notifications.getPermissionsAsync();
 const status=permissions.status==='granted'?permissions.status:(await Notifications.requestPermissionsAsync()).status;
 return status==='granted';
}

export async function getNativePushToken(){
 if(Platform.OS==='web')return null;
 if(!(await ensurePermission()))return null;
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('reminders',{name:'Reminders',importance:Notifications.AndroidImportance.HIGH,sound:'default'});
 const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
 const result=projectId?await Notifications.getExpoPushTokenAsync({projectId}):await Notifications.getExpoPushTokenAsync();
 return result.data;
}

export async function cancelReminderNotification(reminderId:string){
 if(Platform.OS==='web')return;
 const scheduled=await Notifications.getAllScheduledNotificationsAsync();
 await Promise.all(scheduled.filter(item=>item.content.data?.reminderId===reminderId).map(item=>Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function scheduleReminderNotification(reminder:{id:string;title:string;description?:string|null;reminder_type?:string|null;due_at:string;remind_before_minutes?:number|null}){
 if(Platform.OS==='web'||!(await ensurePermission()))return null;
 const due=new Date(reminder.due_at).getTime();
 const lead=Math.max(0,Number(reminder.remind_before_minutes??0))*60000;
 const triggerAt=due-lead;
 if(!Number.isFinite(triggerAt)||triggerAt<=Date.now())return null;
 const scheduled=await Notifications.getAllScheduledNotificationsAsync();
 if(scheduled.some(item=>item.content.data?.reminderId===reminder.id))return null;
 return Notifications.scheduleNotificationAsync({content:{title:`🐎 ${reminder.title}`,body:reminder.description||`${reminder.reminder_type||'Stable reminder'} is coming up.`,sound:'default',data:{reminderId:reminder.id,route:'/(tabs)/calendar'}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(triggerAt)}});
}

export async function replaceReminderNotification(reminder:Parameters<typeof scheduleReminderNotification>[0]){
 if(Platform.OS==='web')return null;
 await cancelReminderNotification(reminder.id);
 return scheduleReminderNotification(reminder);
}

export async function syncReminderNotifications(reminders:Array<Parameters<typeof scheduleReminderNotification>[0]>){
 if(Platform.OS==='web')return;
 for(const reminder of reminders)await scheduleReminderNotification(reminder);
}
