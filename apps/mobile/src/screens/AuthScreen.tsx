import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/RootNavigator';
import { RootState } from '../store';
import { setCredentials, setError, setLoading } from '../store/slices/authSlice';
import { Button, Input, Text, colors } from 'mobile-ui';
import apiClient from '../api/client';
import * as SecureStore from 'expo-secure-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await apiClient.post(endpoint, { email, password });
      
      const { user, token } = response.data;
      
      // Store token securely
      await SecureStore.setItemAsync('auth_token', token);
      
      // Update Redux state
      dispatch(setCredentials({ user, token }));
    } catch (err: any) {
      dispatch(setError(err.response?.data?.message || 'Authentication failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="h1" style={styles.title}>StackTracker</Text>
        <Text variant="subtitle" style={styles.subtitle}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter your email"
            style={styles.input}
          />
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            style={styles.input}
          />

          {error && (
            <Text variant="caption" style={styles.errorText}>
              {error}
            </Text>
          )}

          <Button
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !email || !password}
            style={styles.button}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <Button
            variant="text"
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: colors.gray[600],
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  switchButton: {
    marginTop: 20,
  },
  errorText: {
    marginBottom: 15,
    textAlign: 'center',
    color: colors.error,
  },
}); 