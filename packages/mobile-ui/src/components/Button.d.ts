import React from 'react';
import { ViewStyle, TextStyle, AccessibilityProps, StyleProp } from 'react-native';
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
export declare function Button({
  onPress,
  children,
  variant,
  size,
  disabled,
  loading,
  style,
  textStyle,
  fullWidth,
  leftIcon,
  rightIcon,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  ...accessibilityProps
}: ButtonProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=Button.d.ts.map
