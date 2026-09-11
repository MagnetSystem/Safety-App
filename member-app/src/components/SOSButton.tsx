import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, AccessibilityInfo, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { colors, gradients, typography } from '../constants/theme';
import { heavyFeedback, lightFeedback, tapFeedback } from '../services/haptics';

const HOLD_MS = 2000;
const SIZE = 176;
const BUTTON = 144;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SOSButton({ onArmed, dark = false }: { onArmed: () => void; dark?: boolean }) {
  const [wave1] = useState(() => new Animated.Value(0));
  const [wave2] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [armed, setArmed] = useState(false);
  const holdAnim = useRef<Animated.CompositeAnimation | null>(null);
  const fired = useRef(false);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(2);
  const [holdProgress, setHoldProgress] = useState(0);

  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useFocusEffect(React.useCallback(() => {
    fired.current = false;
    setArmed(false);
    progress.setValue(0);
    setHolding(false);
    setHint(false);
    return () => {
      holdAnim.current?.stop();
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [progress]));
  useEffect(() => {
    if (reduceMotion || !holding) return;
    const createWave = (animValue: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );

    const anim1 = createWave(wave1);
    const anim2 = createWave(wave2);
    anim1.start();
    const timer = setTimeout(() => anim2.start(), 1000);
    return () => {
      anim1.stop();
      anim2.stop();
      clearTimeout(timer);
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, [holding, reduceMotion, wave1, wave2]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setHoldProgress(value);
      setSecondsLeft(Math.max(1, Math.ceil((1 - value) * (HOLD_MS / 1000))));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const stopHold = (reset: boolean) => {
    holdAnim.current?.stop();
    holdAnim.current = null;
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
    setHolding(false);
    if (reset && !fired.current) {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
  };

  const arm = () => {
    if (fired.current) return;
    fired.current = true;
    setArmed(true);
    stopHold(false);
    heavyFeedback();
    onArmed();
  };

  const onPressIn = () => {
    if (fired.current) return;
    setHint(false);
    setHolding(true);
    tapFeedback();
    progress.setValue(0);
    tickTimer.current = setInterval(() => lightFeedback(), 400);
    holdAnim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished) arm();
    });
  };

  const onPressOut = () => {
    if (fired.current) return;
    const started = holding;
    stopHold(true);
    if (started) setHint(true);
  };

  const ringStyle = (animValue: Animated.Value) => ({
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.12],
        }),
      },
    ],
    opacity: !holding || reduceMotion ? 0 : animValue.interpolate({
      inputRange: [0, 0.6, 1],
      outputRange: [0.5, 0.2, 0],
    }),
  });

  const strokeDashoffset = CIRCUMFERENCE * (1 - holdProgress);

  return (
    <View style={styles.wrap}>
      <View style={styles.sosContainer}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.sosRing, { backgroundColor: '#e05c5c' }, ringStyle(wave1)]} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.sosRing, { backgroundColor: '#e05c5c' }, ringStyle(wave2)]} />

        <Svg width={SIZE} height={SIZE} style={styles.progressSvg}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(224, 96, 92, 0.22)"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={holdProgress > 0.01 ? '#FFFFFF' : 'transparent'}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS"
          accessibilityHint="Hold for two seconds to send an alert. Screen reader users can activate to confirm."
          onAccessibilityTap={() => Alert.alert('Send emergency SOS?', 'This alerts your configured recipients.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Send SOS', onPress: arm }])}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPressOut}
          disabled={armed}
          style={styles.sosBtnWrapper}
        >
          <LinearGradient colors={gradients.coral} locations={gradients.coralLocations} style={styles.sosGradient}>
            <Text style={styles.sosTitle}>{holding ? secondsLeft : 'SOS'}</Text>
            <Text style={styles.sosSubtitle}>{holding ? 'Keep holding' : 'Emergency'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
      <Text style={[styles.holdHint, dark && { color: '#E0E3F0' }, hint && styles.holdHintActive]}>
        {hint ? 'Keep holding for 2 seconds to send' : 'Hold for 2 seconds to send SOS'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  sosContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sosRing: {
    borderRadius: SIZE / 2,
  },
  progressSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  sosBtnWrapper: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    overflow: 'hidden',
    shadowColor: '#E0605C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 5,
  },
  sosGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 30,
    letterSpacing: -0.5,
    color: '#FFF',
  },
  sosSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  holdHint: {
    ...typography.caption,
    color: colors.mutedink,
    marginTop: 10,
  },
  holdHintActive: {
    color: '#E0605C',
    fontFamily: 'Inter_500Medium',
  },
});
