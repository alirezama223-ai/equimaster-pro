import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ExploreTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>SHABDIZ</Text>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover everything in your equestrian world.</Text>

        <ExploreCard icon="🐴" title="My Horses" body="Manage profiles, details and your stable." onPress={() => router.push('/(tabs)/horses')} />
        <ExploreCard icon="🏇" title="Training" body="Build training routines and track progress." />
        <ExploreCard icon="🛒" title="Marketplace" body="Discover horses and equestrian listings." />
        <ExploreCard icon="🧬" title="Breeding Lab" body="Explore pedigrees, traits and breeding goals." />
        <ExploreCard icon="📅" title="Events & Calendar" body="Keep competitions, appointments and reminders together." onPress={() => router.push('/(tabs)/calendar')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ExploreCard({ icon, title, body, onPress }: { icon: string; title: string; body: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.copy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
      <Text style={styles.arrow}>{onPress ? '›' : 'Soon'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { padding: 22, paddingBottom: 40 },
  brand: { fontSize: 31, fontWeight: '900', letterSpacing: 2.5, color: '#0E5A45' },
  title: { marginTop: 22, fontSize: 34, fontWeight: '900', color: '#151817' },
  subtitle: { marginTop: 5, marginBottom: 22, fontSize: 16, lineHeight: 23, color: '#777D79', fontWeight: '600' },
  card: { minHeight: 104, marginBottom: 13, padding: 18, borderRadius: 21, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1DFD9', flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  icon: { fontSize: 31, width: 48 },
  copy: { flex: 1, paddingRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#151817' },
  cardBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#777D79', fontWeight: '600' },
  arrow: { fontSize: 13, fontWeight: '900', color: '#0E5A45' },
});
