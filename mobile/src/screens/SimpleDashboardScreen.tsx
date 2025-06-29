import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '@/types/navigation';

type DashboardScreenProps = RootStackScreenProps<'Dashboard'>;

export default function SimpleDashboardScreen({ navigation }: DashboardScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Health Dashboard</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('Supplements')}
          >
            <Text style={styles.cardTitle}>Supplements</Text>
            <Text style={styles.cardDescription}>Track your daily supplements</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.cardMargin]}
            onPress={() => navigation.navigate('Labs')}
          >
            <Text style={styles.cardTitle}>Lab Results</Text>
            <Text style={styles.cardDescription}>View your biomarker data</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.card, styles.fullWidthCard]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.cardTitle}>Health Profile</Text>
          <Text style={styles.cardDescription}>Manage your health information and preferences</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardMargin: {
    marginLeft: 8,
  },
  fullWidthCard: {
    marginTop: 16,
    marginLeft: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});