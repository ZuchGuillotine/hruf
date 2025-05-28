import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../theme';

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

export function Input({
  value,
  onChangeText,
  label,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
  style,
  inputStyle,
  error,
}: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text variant="caption" style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          inputStyle,
        ]}
      />
      {error && (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.gray[700],
  },
  input: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    marginTop: spacing.xs,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
}); 