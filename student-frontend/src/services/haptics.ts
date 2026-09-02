import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// expo-haptics is a no-op on web but the calls still throw in some browsers,
// so guard here once rather than at every call site.
const enabled = Platform.OS !== 'web';

export function tapFeedback() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function heavyFeedback() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function successFeedback() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warningFeedback() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
