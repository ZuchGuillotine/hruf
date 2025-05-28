import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {/* Add profile information here */}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biomarkers</Text>
        {/* Add biomarker tracking here */}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supplements</Text>
        {/* Add supplement tracking here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
}); 