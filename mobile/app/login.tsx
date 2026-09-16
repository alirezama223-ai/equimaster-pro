import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const C = { green: '#174D3F', greenDark: '#103D32', gold: '#D9A93A', cream: '#F7F5F0', white: '#FFFFFF', muted: '#7B817D', soft: '#EAF2EE' };

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function sendLink() {
    const value = email.trim().toLowerCase();
    if (!value) return;
    setBusy(true); setMessage('');
    const redirectTo = Linking.createURL('auth/callback');
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });
    if (error) { setMessage(error.message); setSent(false); } else { setSent(true); setMessage('Secure sign-in link sent. Check your email and tap the link to continue.'); }
    setBusy(false);
  }

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}><Text style={styles.close}>‹</Text><Text style={styles.closeText}>Back</Text></Pressable>
        <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandS}>S</Text></View><View><Text style={styles.brand}>SHABDIZ</Text><Text style={styles.eyebrow}>EQUESTRIAN PLATFORM</Text></View></View>
        <View style={styles.panel}>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Sign in to access your horses, training, health, competitions and stable tools.</Text>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#A5AAA6" value={email} onChangeText={setEmail} style={styles.input}/>
          {message ? <View style={[styles.messageBox, sent ? styles.successBox : styles.errorBox]}><Text style={[styles.message, sent ? styles.success : styles.error]}>{message}</Text></View> : null}
          <Pressable disabled={busy || !email.trim()} onPress={sendLink} style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || !email.trim()) && styles.disabled]}>{busy ? <ActivityIndicator color={C.greenDark}/> : <Text style={styles.buttonText}>Send secure link</Text>}</Pressable>
          <View style={styles.note}><Text style={styles.noteIcon}>🔐</Text><Text style={styles.noteText}>Your session is stored securely on this device. No password is required.</Text></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.cream},container:{flex:1},content:{paddingHorizontal:24,paddingTop:8,paddingBottom:36},closeButton:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start',paddingVertical:8},close:{color:C.green,fontSize:32,lineHeight:30,fontWeight:'500'},closeText:{marginLeft:5,color:C.green,fontSize:15,fontWeight:'800'},
  brandRow:{marginTop:22,flexDirection:'row',alignItems:'center'},brandMark:{width:50,height:50,borderRadius:25,borderWidth:1.5,borderColor:C.gold,alignItems:'center',justifyContent:'center'},brandS:{color:C.gold,fontSize:26,fontWeight:'900'},brand:{marginLeft:13,color:C.green,fontSize:28,letterSpacing:3,fontWeight:'900'},eyebrow:{marginLeft:13,marginTop:2,color:C.gold,fontSize:8,letterSpacing:2.1,fontWeight:'900'},
  panel:{marginTop:28,padding:24,borderRadius:26,backgroundColor:C.white,borderWidth:1,borderColor:'#E8E4DB'},title:{color:C.green,fontSize:38,lineHeight:44,fontWeight:'900'},subtitle:{marginTop:10,color:C.muted,fontSize:16,lineHeight:24,fontWeight:'500'},label:{marginTop:24,marginBottom:8,color:C.green,fontSize:11,letterSpacing:1.5,fontWeight:'900'},input:{minHeight:58,paddingHorizontal:17,borderRadius:16,backgroundColor:'#FAFAF8',borderWidth:1,borderColor:'#E4E0D7',color:C.green,fontSize:16},messageBox:{marginTop:12,padding:14,borderRadius:14},successBox:{backgroundColor:C.soft},errorBox:{backgroundColor:'#F6E9E6'},message:{fontSize:14,lineHeight:20,fontWeight:'600'},success:{color:C.green},error:{color:'#A33A2B'},button:{marginTop:16,minHeight:60,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:C.gold},pressed:{opacity:0.82},disabled:{opacity:0.42},buttonText:{color:C.greenDark,fontSize:17,fontWeight:'900'},note:{marginTop:16,padding:15,borderRadius:16,backgroundColor:C.soft,flexDirection:'row'},noteIcon:{fontSize:20,marginRight:10},noteText:{flex:1,color:C.muted,fontSize:12,lineHeight:18,fontWeight:'600'}
});