import React from 'react';
import { TextStyle } from 'react-native';
import { typography } from '../theme';
type TextVariant = keyof typeof typography;
interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
}
export declare function Text({
  children,
  variant,
  color,
  style,
}: TextProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=Text.d.ts.map
