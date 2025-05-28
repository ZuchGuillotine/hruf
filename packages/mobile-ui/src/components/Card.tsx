import React from 'react';
import { Pressable, StyleSheet, ViewStyle, View, AccessibilityProps } from 'react-native';
import { colors, spacing } from '../theme';

type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CardProps extends AccessibilityProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  variant = 'elevated',
  onPress,
  style,
  contentStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = onPress ? 'button' : undefined,
  ...accessibilityProps
}: CardProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      style={[
        styles.base,
        styles[variant],
        onPress && styles.pressable,
        style,
      ]}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      {...accessibilityProps}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  elevated: {
    shadowColor: colors.gray[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  flat: {
    backgroundColor: colors.gray[50],
  },
  pressable: {
    // Add press feedback styles when needed
  },
  content: {
    padding: spacing.md,
  },
}); 