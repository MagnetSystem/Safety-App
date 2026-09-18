import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated, profileIncomplete, isGuardianOnly } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (profileIncomplete) return <Redirect href="/(auth)/complete-profile" />;

  // isGuardianOnly reflects the explicit signup choice, not just "no organization yet" —
  // the Home tab doesn't even render for a guardian-only account (see (tabs)/_layout.tsx).
  return <Redirect href={isGuardianOnly ? '/(tabs)/wards' : '/(tabs)/home'} />;
}
