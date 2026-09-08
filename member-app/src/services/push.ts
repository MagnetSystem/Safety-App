import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from './api';
import { getItem, setItem, deleteItem } from './storage';

const TOKEN_KEY = 'expoPushToken';

// Show a banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId
  );
}

/**
 * Asks permission, gets an Expo push token, and registers it with the API.
 * Silently no-ops on web, on simulators, and in Expo Go on Android (remote
 * push needs a dev build there) — the in-app feed still works everywhere.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return;

    const pid = projectId();
    if (!pid) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: pid });
    if (!token) return;

    const stored = await getItem(TOKEN_KEY);
    if (stored === token) return; // already registered this device

    await api.post('/notifications/push-token', { token, platform: Platform.OS });
    await setItem(TOKEN_KEY, token);
  } catch {
    // best-effort — never block sign-in on push setup
  }
}

/** Called on logout so a shared device doesn't keep getting the alerts. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await getItem(TOKEN_KEY);
    if (token) {
      await api.delete('/notifications/push-token', { data: { token } });
      await deleteItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}
