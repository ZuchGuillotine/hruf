import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import type { RootStackScreenProps } from '@/types/navigation';

type AuthScreenProps = RootStackScreenProps<'Auth'>;

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleAuth = () => {
    // TODO: Implement authentication logic
    console.log('Auth attempt:', { email, password, isLogin });
    // Navigate to dashboard on successful auth
    navigation.navigate('Dashboard');
  };

  return (
    <View style={styles.container} className="bg-white flex-1">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} className="text-gray-900 text-3xl font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle} className="text-gray-600 mb-8">
            {isLogin 
              ? 'Sign in to your health tracking account' 
              : 'Start your health journey today'
            }
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label} className="text-gray-700 font-medium mb-2">
              Email
            </Text>
            <TextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label} className="text-gray-700 font-medium mb-2">
              Password
            </Text>
            <TextInput
              style={styles.input}
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={styles.authButton}
            className="bg-blue-500 rounded-lg p-4 mt-6"
            onPress={handleAuth}
          >
            <Text style={styles.authButtonText} className="text-white text-center font-semibold text-lg">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText} className="text-blue-500 text-center mt-4">
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={styles.linkText} className="text-gray-600 text-center text-sm">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  authButtonText: {},
  switchButton: {},
  switchButtonText: {},
  footer: {
    alignItems: 'center',
  },
  linkText: {},
});