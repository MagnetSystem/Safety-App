import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, radius } from '../constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error anywhere in the tree shows a recovery
 * screen instead of a white screen. In dev the message is shown; in prod it
 * stays generic.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The screen ran into an unexpected error. You can try again — your reports and
          account are safe.
        </Text>
        {__DEV__ && <Text style={styles.detail}>{this.state.error.message}</Text>}
        <Pressable style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: '#FDEFF0',
  },
  title: {
    ...typography.h1,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    color: colors.subink,
    textAlign: 'center',
    lineHeight: 22,
  },
  detail: {
    ...typography.caption,
    color: colors.mutedink,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.indigoink,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.input,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
