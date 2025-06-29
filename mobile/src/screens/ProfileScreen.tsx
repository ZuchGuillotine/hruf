import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import type { RootStackScreenProps } from '@/types/navigation';

type ProfileScreenProps = RootStackScreenProps<'Profile'>;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  return (
    <ScrollView style={styles.container} className="bg-gray-50">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} className="text-gray-900 text-2xl font-bold mb-2">
            Health Profile
          </Text>
          <Text style={styles.subtitle} className="text-gray-600 mb-6">
            Manage your health information
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Basic Information
          </Text>
          
          <View style={styles.card} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} className="text-gray-600 font-medium">
                Age
              </Text>
              <Text style={styles.infoValue} className="text-gray-900">
                Not set
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} className="text-gray-600 font-medium">
                Gender
              </Text>
              <Text style={styles.infoValue} className="text-gray-900">
                Not set
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} className="text-gray-600 font-medium">
                Height
              </Text>
              <Text style={styles.infoValue} className="text-gray-900">
                Not set
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel} className="text-gray-600 font-medium">
                Weight
              </Text>
              <Text style={styles.infoValue} className="text-gray-900">
                Not set
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editButton}
            className="bg-blue-500 rounded-lg p-3"
          >
            <Text style={styles.editButtonText} className="text-white text-center font-medium">
              Edit Profile Information
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} className="text-gray-900 text-lg font-semibold mb-4">
            Account Settings
          </Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-2"
          >
            <Text style={styles.menuItemText} className="text-gray-900 font-medium">
              Privacy & Security
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <Text style={styles.menuItemText} className="text-red-600 font-medium">
              Sign Out
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
  header: {
    marginBottom: 8,
  },
  title: {},
  subtitle: {},
  section: {
    marginBottom: 24,
  },
  sectionTitle: {},
  card: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {},
  infoValue: {},
  editButton: {
    marginTop: 16,
  },
  editButtonText: {},
  menuItem: {
    marginBottom: 8,
  },
  menuItemText: {},
});