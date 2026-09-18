import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated, profileIncomplete, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (profileIncomplete) return <Redirect href="/(auth)/complete-profile" />;

  // No organization: this account exists to be someone's guardian, not to report or arm SOS
  // themselves — the Home tab doesn't even render for them (see (tabs)/_layout.tsx).
  const isGuardianOnly = !user?.organizationId;
  return <Redirect href={isGuardianOnly ? '/(tabs)/wards' : '/(tabs)/home'} />;
}
