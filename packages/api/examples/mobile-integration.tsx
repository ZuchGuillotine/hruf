/**
 * Example: Integrating @hruf/api with a React Native mobile application
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileApi, HrufApiProvider, ConvenienceHooks } from '@hruf/api';

// Create API instance for mobile
const api = createMobileApi({
  baseURL: 'https://your-api.com',
  storage: AsyncStorage,
  tokenKeys: {
    accessToken: 'hruf_auth_token',
    refreshToken: 'hruf_refresh_token'
  }
});

// Login component
function LoginScreen() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { mutateAsync: login, isPending } = ConvenienceHooks.useLogin();
  
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      const result = await login({ username, password });
      
      // Store the token if it's returned in the response
      if (result.user) {
        Alert.alert('Success', `Welcome back, ${result.user.username}!`);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>
      
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={{
          backgroundColor: isPending ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 8,
        }}
        onPress={handleLogin}
        disabled={isPending}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
          {isPending ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Dashboard component
function DashboardScreen() {
  const { data: user } = ConvenienceHooks.useCurrentUser();
  const { data: supplements, isLoading } = ConvenienceHooks.useSupplements(user?.id);
  const { mutateAsync: createSupplement } = ConvenienceHooks.useCreateSupplement();
  const { mutateAsync: logout } = ConvenienceHooks.useLogout();

  const handleAddSupplement = async () => {
    try {
      await createSupplement({
        name: 'Magnesium',
        dosage: '400mg',
        frequency: 'daily',
        notes: 'Take with dinner'
      });
      Alert.alert('Success', 'Supplement added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any local state if needed
    } catch (error: any) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24 }}>Welcome, {user.username}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: '#FF3B30' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Account Info</Text>
        <Text>Email: {user.email}</Text>
        <Text>Subscription: {user.subscriptionTier}</Text>
        {user.trialEndsAt && (
          <Text>Trial ends: {new Date(user.trialEndsAt).toLocaleDateString()}</Text>
        )}
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Your Supplements</Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            padding: 12,
            borderRadius: 8,
            marginBottom: 15
          }}
          onPress={handleAddSupplement}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Add Magnesium</Text>
        </TouchableOpacity>

        {isLoading ? (
          <Text>Loading supplements...</Text>
        ) : (
          supplements?.map(supplement => (
            <View
              key={supplement.id}
              style={{
                backgroundColor: '#f5f5f5',
                padding: 15,
                borderRadius: 8,
                marginBottom: 10
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{supplement.name}</Text>
              <Text>Dosage: {supplement.dosage}</Text>
              <Text>Frequency: {supplement.frequency}</Text>
              {supplement.notes && <Text>Notes: {supplement.notes}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Chat component
function ChatScreen() {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const { mutateAsync: query, isPending } = ConvenienceHooks.useSupplementQuery();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await query([userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 15 }}>Supplement Q&A</Text>
      
      <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8 }}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={{
              backgroundColor: msg.role === 'user' ? '#007AFF' : '#E5E5EA',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <Text style={{ color: msg.role === 'user' ? 'white' : 'black' }}>
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', marginTop: 15 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            borderRadius: 8,
            marginRight: 10
          }}
          placeholder="Ask about supplements..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={{
            backgroundColor: isPending ? '#ccc' : '#007AFF',
            padding: 10,
            borderRadius: 8,
            justifyContent: 'center'
          }}
          onPress={handleSend}
          disabled={isPending || !input.trim()}
        >
          <Text style={{ color: 'white' }}>
            {isPending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Main app with tab navigation
function App() {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'chat'>('dashboard');

  return (
    <HrufApiProvider api={api}>
      <View style={{ flex: 1 }}>
        {/* Tab content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? <DashboardScreen /> : <ChatScreen />}
        </View>

        {/* Simple tab bar */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#f8f8f8',
          borderTopWidth: 1,
          borderTopColor: '#e1e1e1'
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 15,
              backgroundColor: activeTab === 'dashboard' ? '#007AFF' : 'transparent'
            }}
            onPress={() => setActiveTab('dashboard')}
          >
            <Text style={{
              textAlign: 'center',
              color: activeTab === 'dashboard' ? 'white' : '#007AFF'
            }}>
              Dashboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 15,
              backgroundColor: activeTab === 'chat' ? '#007AFF' : 'transparent'
            }}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={{
              textAlign: 'center',
              color: activeTab === 'chat' ? 'white' : '#007AFF'
            }}>
              Chat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </HrufApiProvider>
  );
}

export default App;