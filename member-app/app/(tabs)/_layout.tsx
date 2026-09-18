import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { useAuth } from '../../src/store/AuthContext';

export default function TabsLayout() {
  // Explicit signup choice, not "no organization yet" — a real member who hasn't joined an
  // org shouldn't lose Home/My reports/SOS just because that field is empty.
  const { isGuardianOnly } = useAuth();

  return (
    <Tabs
      tabBar={(props: any) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isGuardianOnly && (
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
      )}
      {!isGuardianOnly && (
        <Tabs.Screen
          name="reports"
          options={{
            title: 'My reports',
          }}
        />
      )}
      <Tabs.Screen
        name="wards"
        options={{
          title: 'Guardian',
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
