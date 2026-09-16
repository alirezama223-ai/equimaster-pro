import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const cards = [
  { title: 'My Horses', text: 'Manage your horses', icon: '🐎' },
  { title: 'Training', text: 'Training & progress', icon: '🏇' },
  { title: 'Marketplace', text: 'Discover horses', icon: '🛒' },
  { title: 'Breeding', text: 'Smart breeding tools', icon: '🧬' },
];

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SHABDIZ</Text>
          <Text style={styles.subtitle}>Equestrian Platform</Text>
        </View>
        <Pressable style={styles.profile} accessibilityLabel="Profile">
          <Text style={styles.profileIcon}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>WELCOME TO</Text>
        <Text style={styles.heroTitle}>SHABDIZ</Text>
        <Text style={styles.heroText}>
          Your complete equestrian world — horses, training, marketplace and intelligent tools.
        </Text>
        <Pressable style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Explore SHABDIZ</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Your Equestrian World</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable key={card.title} style={styles.card}>
            <Text style={styles.icon}>{card.icon}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardText}>{card.text}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 28, paddingBottom: 120, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  logo: { color: colors.primary, fontSize: 42, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: colors.muted, fontSize: 19, marginTop: 2 },
  profile: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#1687E8', alignItems: 'center', justifyContent: 'center' },
  profileIcon: { fontSize: 27 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.card, padding: 30, marginBottom: 38 },
  kicker: { color: '#F5F0E7', fontSize: 15, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', letterSpacing: 1 },
  heroText: { color: '#F5F5F1', fontSize: 21, lineHeight: 34, marginTop: 22 },
  heroButton: { backgroundColor: '#FFFFFF', borderRadius: radius.button, paddingVertical: 18, paddingHorizontal: 24, alignSelf: 'flex-start', marginTop: 28 },
  heroButtonText: { color: colors.primary, fontSize: 19, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 32, fontWeight: '900', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '47.5%', minHeight: 185, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 22 },
  icon: { fontSize: 30, marginBottom: 28 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  cardText: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
});
