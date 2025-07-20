import React from 'react';
import { Card, CardContent } from './ui';
import { clsx } from 'clsx';
import { StyledView, StyledText } from '@/lib/styled';

interface NavigationCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onPress: () => void;
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function NavigationCard({
  title,
  description,
  icon,
  onPress,
  className,
  color = 'blue',
}: NavigationCardProps) {
  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return 'border-green-200 bg-green-50';
      case 'purple':
        return 'border-purple-200 bg-purple-50';
      case 'orange':
        return 'border-orange-200 bg-orange-50';
      case 'red':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getIconColorStyles = () => {
    switch (color) {
      case 'green':
        return 'bg-green-100';
      case 'purple':
        return 'bg-purple-100';
      case 'orange':
        return 'bg-orange-100';
      case 'red':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <Card
      onPress={onPress}
      className={clsx(
        'mb-4 shadow-md border-2',
        getColorStyles(),
        className
      )}
    >
      <CardContent className="flex-row items-center p-4">
        {icon && (
          <StyledView className={clsx(
            'w-12 h-12 rounded-full items-center justify-center mr-4',
            getIconColorStyles()
          )}>
            {icon}
          </StyledView>
        )}
        <StyledView className="flex-1">
          <StyledText className="text-lg font-semibold text-gray-900 mb-1">
            {title}
          </StyledText>
          <StyledText className="text-sm text-gray-600">
            {description}
          </StyledText>
        </StyledView>
      </CardContent>
    </Card>
  );
}