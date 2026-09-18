import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { useAuth } from '../../src/store/AuthContext';

export default function TabsLayout() {
  // Explicit signup choice, not "no organization yet" — a real member who hasn't joined an
  // org shouldn't lose Home/My reports/SOS just because that field is empty.
  const { isGuardianOnly } = useAuth();

  // `href: null` (not conditionally omitting the <Tabs.Screen>) is the pattern Expo Router
  // documents for hiding a tab — the screen's route stays registered (needed for web deep
  // links), but is excluded from the tab bar. TabBar reads this via descriptors below.
  const hiddenIfGuardianOnly = isGuardianOnly ? null : undefined;

  return (
    <Tabs
      tabBar={(props: any) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: hiddenIfGuardianOnly,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'My reports',
          href: hiddenIfGuardianOnly,
        }}
      />
      <Tabs.Screen
        name="wards"
        options={{
          title: 'Watching',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
