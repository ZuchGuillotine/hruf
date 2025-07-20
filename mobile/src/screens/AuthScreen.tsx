import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import type { RootStackScreenProps } from '@/types/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StyledView, StyledText, StyledTouchableOpacity, StyledTextInput } from '@/lib/styled';

type AuthScreenProps = RootStackScreenProps<'Auth'>;

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');

  const { 
    login, 
    register, 
    isLoginLoading, 
    isRegisterLoading, 
    loginError, 
    registerError 
  } = useAuth();

  const handleAuth = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && !email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (isLogin) {
      login({ username: username.trim(), password });
    } else {
      register({ username: username.trim(), email: email.trim(), password });
    }
  };

  React.useEffect(() => {
    if (loginError) {
      Alert.alert('Login Failed', loginError.message || 'An error occurred during login');
    }
  }, [loginError]);

  React.useEffect(() => {
    if (registerError) {
      Alert.alert('Registration Failed', registerError.message || 'An error occurred during registration');
    }
  }, [registerError]);

  const isLoading = isLoginLoading || isRegisterLoading;

  return (
    <StyledView style={styles.container} className="bg-white flex-1">
      <StyledView style={styles.content}>
        <StyledView style={styles.header}>
          <StyledText style={styles.title} className="text-gray-900 text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </StyledText>
          <StyledText style={styles.subtitle} className="text-gray-600 mb-8">
            {isLogin 
              ? 'Sign in to your health tracking account' 
              : 'Start your health journey today'
            }
          </StyledText>
        </StyledView>

        <StyledView style={styles.form}>
          <StyledView style={styles.inputGroup}>
            <StyledText style={styles.label} className="text-gray-700 font-medium mb-2">
              Username
            </StyledText>
            <StyledTextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </StyledView>

          {!isLogin && (
            <StyledView style={styles.inputGroup}>
              <StyledText style={styles.label} className="text-gray-700 font-medium mb-2">
                Email
              </StyledText>
              <StyledTextInput
                style={styles.input}
                className="border border-gray-300 rounded-lg p-3 text-gray-900"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </StyledView>
          )}

          <StyledView style={styles.inputGroup}>
            <StyledText style={styles.label} className="text-gray-700 font-medium mb-2">
              Password
            </StyledText>
            <StyledTextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </StyledView>

          <StyledTouchableOpacity 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]}
            className={`${isLoading ? 'bg-gray-400' : 'bg-blue-500'} rounded-lg p-4 mt-6`}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <StyledText style={styles.authButtonText} className="text-white text-center font-semibold text-lg">
              {isLoading 
                ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </StyledText>
          </StyledTouchableOpacity>

          <StyledTouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={isLoading}
          >
            <StyledText style={styles.switchButtonText} className={`${isLoading ? 'text-gray-400' : 'text-blue-500'} text-center mt-4`}>
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView style={styles.footer}>
          <StyledTouchableOpacity>
            <StyledText style={styles.linkText} className="text-gray-600 text-center text-sm">
              Forgot Password?
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {},
  subtitle: {},
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {},
  input: {
    fontSize: 16,
  },
  authButton: {},
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {},
  switchButton: {},
  switchButtonText: {},
  footer: {
    alignItems: 'center',
  },
  linkText: {},
});