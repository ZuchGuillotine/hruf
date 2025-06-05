import React from 'react';
import { ViewStyle, AccessibilityProps } from 'react-native';
type CardVariant = 'elevated' | 'outlined' | 'flat';
interface CardProps extends AccessibilityProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}
export declare function Card({
  children,
  variant,
  onPress,
  style,
  contentStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  ...accessibilityProps
}: CardProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=Card.d.ts.map
