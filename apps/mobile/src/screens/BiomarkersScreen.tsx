import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Text } from '@stacktracker/mobile-ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Biomarkers'>;

export function BiomarkersScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="h1">Biomarkers</Text>
      <Text variant="body">Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 