import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * react-native-web's Alert.alert is a literal no-op stub — it never shows anything and never
 * calls a button's onPress. Any destructive action gated behind Alert.alert's buttons array
 * silently never runs when the app is opened in a browser. This falls back to window.confirm
 * on web and uses the real native Alert everywhere else.
 */
export function confirmAsync({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(text) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
