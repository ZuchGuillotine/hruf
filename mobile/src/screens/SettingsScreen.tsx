import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import type { RootStackScreenProps } from '@/types/navigation';

type SettingsScreenProps = RootStackScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  return (
    <ScrollView style={styles.container} className="bg-gray-50">
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Notifications
          </Text>
          
          <View style={styles.settingItem} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2">
            <View style={styles.settingContent}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle} className="text-gray-900 font-medium">
                  Push Notifications
                </Text>
                <Text style={styles.settingDescription} className="text-gray-600 text-sm">
                  Receive reminders for supplements and lab uploads
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Security
          </Text>
          
          <View style={styles.settingItem} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2">
            <View style={styles.settingContent}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle} className="text-gray-900 font-medium">
                  Biometric Authentication
                </Text>
                <Text style={styles.settingDescription} className="text-gray-600 text-sm">
                  Use fingerprint or face ID to secure your app
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={biometricEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Change Password
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Data & Privacy
          </Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Export My Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Support
          </Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Help Center
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Contact Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              About
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.dangerButton}
            className="bg-red-500 rounded-lg p-4"
          >
            <Text style={styles.dangerButtonText} className="text-white text-center font-semibold">
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {},
  settingItem: {},
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    marginBottom: 2,
  },
  settingDescription: {},
  menuItem: {
    marginBottom: 8,
  },
  menuItemText: {},
  dangerButton: {},
  dangerButtonText: {},
});