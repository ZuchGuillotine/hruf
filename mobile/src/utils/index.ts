// Temporary: Comment out shared package import until workspace is fixed
// export * from '@hruf/utils';

// Mobile-specific utilities
export const platformUtils = {
  isIOS: () => require('react-native').Platform.OS === 'ios',
  isAndroid: () => require('react-native').Platform.OS === 'android',
  
  // Screen dimension helpers
  getScreenDimensions: () => {
    const { Dimensions } = require('react-native');
    return Dimensions.get('window');
  },
  
  // Safe area helpers
  getSafeAreaInsets: () => {
    // This would typically use react-native-safe-area-context
    // For now, return default values
    return { top: 0, bottom: 0, left: 0, right: 0 };
  },
  
  // Device orientation
  isLandscape: () => {
    const { width, height } = require('react-native').Dimensions.get('window');
    return width > height;
  },
  
  // Haptic feedback
  hapticFeedback: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      const { HapticFeedback } = require('expo-haptics');
      switch (type) {
        case 'light':
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      // Haptic feedback not available on this device
      console.warn('Haptic feedback not available:', error);
    }
  },
};

// Toast/Alert utilities for mobile
export const alertUtils = {
  show: (title: string, message?: string) => {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  },
  
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    const { Alert } = require('react-native');
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', onPress: onCancel, style: 'cancel' },
        { text: 'OK', onPress: onConfirm },
      ]
    );
  },
};

// Navigation helpers
export const navigationUtils = {
  // Common navigation patterns
  resetToScreen: (navigation: any, screenName: string) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName }],
    });
  },
  
  // Deep linking helpers
  parseDeepLink: (url: string) => {
    try {
      const parsed = new URL(url);
      return {
        pathname: parsed.pathname,
        params: Object.fromEntries(parsed.searchParams.entries()),
      };
    } catch (error) {
      return null;
    }
  },
};