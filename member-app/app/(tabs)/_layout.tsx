import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { useAuth } from '../../src/store/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();
  // No organization means nothing to report and no reason to arm your own SOS from here —
  // this account exists purely to watch over someone else, so Home/My reports don't apply.
  const isGuardianOnly = !!user && !user.organizationId;

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
