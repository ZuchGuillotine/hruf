// NativeWind v4 doesn't use styled() approach
// Instead, we'll export the regular components with TypeScript overrides
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';

// For NativeWind v4, className is handled by the babel plugin
// These are just type-safe wrappers
export const StyledView = View as typeof View & { className?: string };
export const StyledText = Text as typeof Text & { className?: string };
export const StyledTouchableOpacity = TouchableOpacity as typeof TouchableOpacity & { className?: string };
export const StyledScrollView = ScrollView as typeof ScrollView & { className?: string };
export const StyledTextInput = TextInput as typeof TextInput & { className?: string };