import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1F2933',
        tabBarInactiveTintColor: '#8B918E',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { height: 70, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FFFFFF', borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => null }} />
      <Tabs.Screen name="horses" options={{ title: 'My Horses', tabBarIcon: () => null }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: () => null }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: () => null }} />
    </Tabs>
  );
}
