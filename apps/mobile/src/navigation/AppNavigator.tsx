import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AddSupplementScreen } from '../screens/AddSupplementScreen';
import { AddBiomarkerScreen } from '../screens/AddBiomarkerScreen';
import { SupplementsScreen } from '../screens/SupplementsScreen';
import { BiomarkersScreen } from '../screens/BiomarkersScreen';

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddSupplement: undefined;
  AddBiomarker: undefined;
  Supplements: undefined;
  Biomarkers: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          // Add tab bar icon here
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          // Add tab bar icon here
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          // Add tab bar icon here
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export function AppNavigator() {
  // TODO: Add auth state management
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="AddSupplement" 
              component={AddSupplementScreen}
              options={{ 
                headerShown: true,
                title: 'Add Supplement',
              }}
            />
            <Stack.Screen 
              name="AddBiomarker" 
              component={AddBiomarkerScreen}
              options={{ 
                headerShown: true,
                title: 'Add Biomarker',
              }}
            />
            <Stack.Screen 
              name="Supplements" 
              component={SupplementsScreen}
              options={{ 
                headerShown: true,
                title: 'Supplements',
              }}
            />
            <Stack.Screen 
              name="Biomarkers" 
              component={BiomarkersScreen}
              options={{ 
                headerShown: true,
                title: 'Biomarkers',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 