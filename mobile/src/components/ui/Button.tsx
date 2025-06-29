import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { clsx } from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  className,
  style,
  textStyle,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border border-gray-200';
      case 'outline':
        return 'bg-transparent border border-gray-300';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-blue-600 border border-blue-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2';
      case 'lg':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getTextVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'text-gray-900';
      case 'outline':
        return 'text-gray-700';
      case 'ghost':
        return 'text-blue-600';
      default:
        return 'text-white';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      className={clsx(
        'rounded-lg items-center justify-center flex-row',
        getVariantStyles(),
        getSizeStyles(),
        (disabled || loading) && 'opacity-50',
        className
      )}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'default' ? 'white' : '#3b82f6'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={textStyle}
        className={clsx(
          'font-medium text-center',
          getTextVariantStyles(),
          getTextSizeStyles()
        )}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}