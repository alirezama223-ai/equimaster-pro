import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Vet, farrier and stable appointments.</Text>
        <View style={styles.today}><Text style={styles.kicker}>TODAY</Text><Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View>
        <View style={styles.empty}><Text style={styles.icon}>📅</Text><Text style={styles.emptyTitle}>Your calendar is ready</Text><Text style={styles.emptyBody}>The next step is connecting the existing EquiMaster events and reminders to this native calendar view.</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F7F5F0' }, container: { padding: 20 }, title: { fontSize: 30, fontWeight: '800' }, subtitle: { marginTop: 5, fontSize: 15, opacity: 0.55 }, today: { marginTop: 24, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' }, kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, opacity: 0.45 }, date: { marginTop: 8, fontSize: 19, fontWeight: '800' }, empty: { marginTop: 14, padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center' }, icon: { fontSize: 42 }, emptyTitle: { marginTop: 12, fontSize: 19, fontWeight: '800' }, emptyBody: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 21, opacity: 0.58 } });
