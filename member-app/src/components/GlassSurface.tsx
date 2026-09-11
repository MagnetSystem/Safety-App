import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

export const GlassBackground = createContext<React.RefObject<View | null> | undefined>(undefined);

/** One shared Android blur target avoids capturing cards inside their own blur. */
export function Frost() {
  const target = useContext(GlassBackground);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => subscription.remove();
  }, []);
  if (reduced) return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#F8FAFD' }]} />;
  if (Platform.OS === 'web') return null;
  return <BlurView pointerEvents="none" intensity={28} tint="light" blurTarget={target} blurMethod={target ? 'dimezisBlurViewSdk31Plus' : 'none'} style={StyleSheet.absoluteFill} />;
}
