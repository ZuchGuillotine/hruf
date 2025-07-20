import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from '@/types/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StyledView, StyledText } from '@/lib/styled';

// Import screens
import DashboardScreen from '@/screens/DashboardScreen';
import SupplementsScreen from '@/screens/SupplementsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import LabsScreen from '@/screens/LabsScreen';
import ChatScreen from '@/screens/ChatScreen';
import HealthStatsScreen from '@/screens/HealthStatsScreen';
import AuthScreen from '@/screens/AuthScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icons using emoji
const tabIcons = {
  Dashboard: { focused: '🏠', unfocused: '🏠' },
  Supplements: { focused: '💊', unfocused: '💊' },
  Labs: { focused: '🧪', unfocused: '🧪' },
  Profile: { focused: '👤', unfocused: '👤' },
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const iconSet = tabIcons[route.name as keyof typeof tabIcons];
          return (
            <StyledText className="text-lg">
              {focused ? iconSet.focused : iconSet.unfocused}
            </StyledText>
          );
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTintColor: '#1f2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Supplements" 
        component={SupplementsScreen}
        options={{ title: 'Supplements' }}
      />
      <Tab.Screen 
        name="Labs" 
        component={LabsScreen}
        options={{ title: 'Lab Results' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show loading screen while checking auth state
    return (
      <StyledView className="flex-1 justify-center items-center bg-white">
        <StyledText className="text-lg text-gray-600">Loading...</StyledText>
      </StyledView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainTabs" : "Auth"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ 
                title: 'AI Chat',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="HealthStats" 
              component={HealthStatsScreen}
              options={{ 
                title: 'Health Statistics',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ title: 'Welcome to HRUF', headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}