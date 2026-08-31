import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../src/store/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const isEmergency = pathname.includes('/emergency');

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
    <AuthProvider>
      <StatusBar style={isEmergency ? "light" : "dark"} />
      <PhoneFrame isEmergency={isEmergency}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="report/emergency" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="report/new" />
          <Stack.Screen name="reports/[id]" />
          <Stack.Screen name="notifications" />
        </Stack>
      </PhoneFrame>
    </AuthProvider>
  );
}
