import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { createComplaint, type CreateComplaintInput } from './incidentsService';
import { queueSos } from './pendingSos';

function isNetworkError(err: any): boolean {
  return !err?.response || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error';
}

export type SosLocationStatus = 'active' | 'denied';

export interface SosSendResult {
  complaintId: string | null;
  queuedOffline: boolean;
  location: SosLocationStatus;
  error: string | null;
}

export async function sendEmergencySos(
  onLocation?: (status: SosLocationStatus) => void,
): Promise<SosSendResult> {
  let gps: { gpsLat?: number; gpsLng?: number; gpsAccuracy?: number } = {};
  let location: SosLocationStatus = 'denied';

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({});
      gps = {
        gpsLat: position.coords.latitude,
        gpsLng: position.coords.longitude,
        gpsAccuracy: position.coords.accuracy ?? undefined,
      };
      location = 'active';
    }
  } catch {
    location = 'denied';
  }
  onLocation?.(location);

  const deviceInfo = `${Device.modelName ?? Platform.OS} · ${Device.osName ?? Platform.OS} ${Device.osVersion ?? Platform.Version}`;
  const payload: CreateComplaintInput = {
    type: 'EMERGENCY',
    category: 'OTHER',
    description: 'Emergency SOS alert — no additional details provided.',
    gpsLat: gps.gpsLat,
    gpsLng: gps.gpsLng,
    gpsAccuracy: gps.gpsAccuracy,
    deviceInfo,
  };

  try {
    const created = await createComplaint(payload);
    return { complaintId: created.id, queuedOffline: false, location, error: null };
  } catch (err: any) {
    if (isNetworkError(err)) {
      await queueSos(payload);
      return { complaintId: null, queuedOffline: true, location, error: null };
    }
    return {
      complaintId: null,
      queuedOffline: false,
      location,
      error: err?.response?.data?.message ?? 'Could not send the alert. Please try again.',
    };
  }
}
