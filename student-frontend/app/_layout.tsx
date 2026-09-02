import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '../src/store/AuthContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

function useNotificationNavigation() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const openFromData = (data: unknown) => {
      const complaintId = (data as { complaintId?: string } | undefined)?.complaintId;
      if (complaintId) router.push(`/reports/${complaintId}`);
    };
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (res) openFromData(res.notification.request.content.data);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      openFromData(res.notification.request.content.data);
    });
    return () => sub.remove();
  }, [router]);
}

export default function RootLayout() {
  const pathname = usePathname();
  const isEmergency = pathname.includes('/emergency');
  useNotificationNavigation();

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style={isEmergency ? "light" : "dark"} />
        <PhoneFrame isEmergency={isEmergency}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(auth)/forgot-password" />
            <Stack.Screen name="(auth)/reset-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="report/emergency" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="report/new" />
            <Stack.Screen name="reports/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="help" />
          </Stack>
        </PhoneFrame>
      </AuthProvider>
    </ErrorBoundary>
  );
}
