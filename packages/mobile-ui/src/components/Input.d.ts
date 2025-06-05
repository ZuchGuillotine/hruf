import { ViewStyle, TextStyle } from 'react-native';
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  error?: string;
}
export declare function Input({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  inputStyle,
  error,
}: InputProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=Input.d.ts.map
