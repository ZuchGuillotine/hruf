import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { clsx } from 'clsx';
import { StyledView, StyledText, StyledTouchableOpacity } from '@/lib/styled';

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
  if (onPress) {
    return (
      <StyledTouchableOpacity
        onPress={onPress}
        style={style}
        className={clsx(
          "bg-white rounded-xl shadow-sm border border-gray-200 p-4",
          className
        )}
      >
        {children}
      </StyledTouchableOpacity>
    );
  }
  
  return (
    <StyledView
      style={style}
      className={clsx(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-4",
        className
      )}
    >
      {children}
    </StyledView>
  );
}

export function CardHeader({ children, className, style }: CardHeaderProps) {
  return (
    <StyledView style={style} className={clsx("pb-2", className)}>
      {children}
    </StyledView>
  );
}

export function CardTitle({ children, className, style }: CardTitleProps) {
  return (
    <StyledText
      style={style}
      className={clsx("text-lg font-semibold text-gray-900", className)}
    >
      {children}
    </StyledText>
  );
}

export function CardDescription({ children, className, style }: CardDescriptionProps) {
  return (
    <StyledText
      style={style}
      className={clsx("text-sm text-gray-600", className)}
    >
      {children}
    </StyledText>
  );
}

export function CardContent({ children, className, style }: CardContentProps) {
  return (
    <StyledView style={style} className={clsx("pt-2", className)}>
      {children}
    </StyledView>
  );
}