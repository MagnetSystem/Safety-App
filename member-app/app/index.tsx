import { Redirect } from 'expo-router';
import { useAuth } from '../src/store/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated, profileIncomplete } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return <Redirect href={profileIncomplete ? '/(auth)/complete-profile' : '/(tabs)/home'} />;
}
