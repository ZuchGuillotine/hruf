import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className, style, onPress }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      onPress={onPress}
      style={style}
      className={clsx(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-4",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className, style }: CardHeaderProps) {
  return (
    <View style={style} className={clsx("pb-2", className)}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className, style }: CardTitleProps) {
  return (
    <Text
      style={style}
      className={clsx("text-lg font-semibold text-gray-900", className)}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ children, className, style }: CardDescriptionProps) {
  return (
    <Text
      style={style}
      className={clsx("text-sm text-gray-600", className)}
    >
      {children}
    </Text>
  );
}

export function CardContent({ children, className, style }: CardContentProps) {
  return (
    <View style={style} className={clsx("pt-2", className)}>
      {children}
    </View>
  );
}