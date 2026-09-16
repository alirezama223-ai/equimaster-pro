import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function HomeTab() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const firstName = email
    ? email.split('@')[0].replace(/[._-]/g, ' ')
    : 'Rider';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/shabdiz-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Pressable
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/(tabs)/account')}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* GREETING */}
        <View style={styles.greetingBlock}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.greeting}>Good afternoon</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>YOUR STABLE</Text>
              <Text style={styles.heroTitle}>At a glance.</Text>
            </View>

            <View style={styles.goldMark}>
              <Text style={styles.goldMarkText}>S</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            Horses, training, health and competitions — all in one place.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.heroButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/(tabs)/horses')}
          >
            <Text style={styles.heroButtonText}>View My Horses</Text>
            <Text style={styles.heroArrow}>→</Text>
          </Pressable>
        </View>

        {/* QUICK ACCESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <Text style={styles.sectionCaption}>YOUR WORLD</Text>
        </View>

        <View style={styles.grid}>
          <Action
            icon="🐎"
            title="My Horses"
            subtitle="Manage horses"
            onPress={() => router.push('/(tabs)/horses')}
          />

          <Action
            icon="🏇"
            title="Training"
            subtitle="Track sessions"
            onPress={() => router.push('/(tabs)/training')}
          />

          <Action
            icon="🏆"
            title="Competitions"
            subtitle="Prepare & compete"
            onPress={() => router.push('/(tabs)/competitions')}
          />

          <Action
            icon="◷"
            title="Calendar"
            subtitle="Your schedule"
            onPress={() => router.push('/(tabs)/calendar')}
          />
        </View>

        {/* TODAY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionCaption}>16 SEPTEMBER</Text>
        </View>

        <View style={styles.todayCard}>
          <TodayRow
            icon="🏇"
            title="Training"
            subtitle="No training scheduled"
            accent="green"
          />

          <View style={styles.rowDivider} />

          <TodayRow
            icon="🔔"
            title="Reminders"
            subtitle="Check your upcoming reminders"
            accent="gold"
          />

          <View style={styles.rowDivider} />

          <TodayRow
            icon="🏆"
            title="Competitions"
            subtitle="No competition today"
            accent="navy"
          />
        </View>

        {/* BRAND CARD */}
        <View style={styles.brandCard}>
          <Text style={styles.brandEyebrow}>SHABDIZ</Text>
          <Text style={styles.brandTitle}>
            Your complete equestrian world.
          </Text>
          <Text style={styles.brandText}>
            One intelligent platform for horses, riders, training,
            competitions and stable management.
          </Text>
        </View>

        <Text style={styles.version}>SHABDIZ · Equestrian Platform</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.actionIconBox}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>

      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function TodayRow({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: 'green' | 'gold' | 'navy';
}) {
  return (
    <View style={styles.todayRow}>
      <View
        style={[
          styles.todayIcon,
          accent === 'green' && styles.greenIcon,
          accent === 'gold' && styles.goldIcon,
          accent === 'navy' && styles.navyIcon,
        ]}
      >
        <Text style={styles.todayIconText}>{icon}</Text>
      </View>

      <View style={styles.todayContent}>
        <Text style={styles.todayTitle}>{title}</Text>
        <Text style={styles.todaySubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.todayArrow}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5F0',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 42,
  },

  header: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 210,
    height: 62,
  },

  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },

  settingsIcon: {
    fontSize: 22,
    color: '#244E40',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E1D8',
  },

  greetingBlock: {
    marginTop: 25,
    marginBottom: 22,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: '#B58A32',
  },

  greeting: {
    marginTop: 7,
    fontSize: 16,
    color: '#737873',
  },

  name: {
    marginTop: 1,
    fontSize: 29,
    fontWeight: '900',
    color: '#173E32',
    textTransform: 'capitalize',
  },

  hero: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#173E32',
    overflow: 'hidden',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  heroEyebrow: {
    color: '#D8B45A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  heroTitle: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
  },

  goldMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C9A44E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldMarkText: {
    color: '#D8B45A',
    fontSize: 23,
    fontWeight: '900',
  },

  heroText: {
    marginTop: 13,
    color: '#DDE7E2',
    fontSize: 14,
    lineHeight: 21,
  },

  heroButton: {
    marginTop: 19,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#D8AA3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroButtonText: {
    color: '#142D25',
    fontSize: 14,
    fontWeight: '900',
  },

  heroArrow: {
    color: '#142D25',
    fontSize: 22,
    fontWeight: '800',
  },

  sectionHeader: {
    marginTop: 27,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#173E32',
  },

  sectionCaption: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#9A9B96',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },

  action: {
    width: '48%',
    minHeight: 128,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },

  actionIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#EDF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIcon: {
    fontSize: 23,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E312A',
  },

  actionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: '#8A8E89',
  },

  todayCard: {
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4DC',
  },

  todayRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
  },

  todayIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greenIcon: {
    backgroundColor: '#E5F0EA',
  },

  goldIcon: {
    backgroundColor: '#F6EDDA',
  },

  navyIcon: {
    backgroundColor: '#E8EDF1',
  },

  todayIconText: {
    fontSize: 21,
  },

  todayContent: {
    flex: 1,
    marginLeft: 13,
  },

  todayTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E312A',
  },

  todaySubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#8A8E89',
  },

  todayArrow: {
    marginLeft: 8,
    fontSize: 28,
    color: '#A5A8A4',
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#EEEAE3',
  },

  brandCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#E8F0EB',
  },

  brandEyebrow: {
    color: '#B58A32',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  brandTitle: {
    marginTop: 7,
    color: '#173E32',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },

  brandText: {
    marginTop: 8,
    color: '#617069',
    fontSize: 12,
    lineHeight: 18,
  },

  version: {
    marginTop: 22,
    textAlign: 'center',
    color: '#A1A39F',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});