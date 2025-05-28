import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { typography, colors } from '../theme';

type TextVariant = keyof typeof typography;

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
}

export function Text({ children, variant = 'body', color = colors.text, style }: TextProps) {
  return (
    <RNText style={[styles[variant], { color }, style]}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  subtitle: typography.subtitle,
  body: typography.body,
  caption: typography.caption,
}); 