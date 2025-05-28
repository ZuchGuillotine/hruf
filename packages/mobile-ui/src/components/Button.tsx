import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, AccessibilityProps, StyleProp } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends AccessibilityProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  leftIcon,
  rightIcon,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...accessibilityProps
}: ButtonProps) {
  const getButtonStyles = (pressed: boolean): StyleProp<ViewStyle> => [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    pressed && styles.pressed,
    style,
  ];

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.textBase,
      ...styles[`${variant}Text`],
      ...styles[`${size}Text`],
    };

    if (disabled) {
      Object.assign(baseStyle, styles.disabledText);
    }

    if (leftIcon || rightIcon) {
      Object.assign(baseStyle, styles.textWithIcon);
    }

    if (textStyle) {
      Object.assign(baseStyle, textStyle);
    }

    return baseStyle;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => getButtonStyles(pressed)}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: disabled || loading }}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'text' ? colors.primary : colors.background}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={getTextStyles()}>
            {children}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  fullWidth: {
    width: '100%',
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textWithIcon: {
    marginHorizontal: spacing.xs,
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.background,
  },
  textText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.background,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.5,
  },
}); 