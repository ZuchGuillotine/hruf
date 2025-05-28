import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Card, Text, Button, Input } from '@stacktracker/mobile-ui';
import { colors, spacing, typography } from '@stacktracker/mobile-ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSupplement'>;

export function AddSupplementScreen({ navigation }: Props) {
  const [name, setName] = React.useState('');
  const [dosage, setDosage] = React.useState('');
  const [unit, setUnit] = React.useState('mg');
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      // TODO: Implement supplement addition
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add supplement:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Card variant="elevated" style={styles.formCard}>
          <Text variant="h2" style={styles.title}>Add New Supplement</Text>
          
          <View style={styles.formGroup}>
            <Text variant="caption">Supplement Name</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., Vitamin D3"
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text variant="caption">Dosage</Text>
            <View style={styles.dosageContainer}>
              <Input
                value={dosage}
                onChangeText={setDosage}
                placeholder="Amount"
                keyboardType="numeric"
                inputStyle={styles.dosageInput}
                style={styles.input}
              />
              <View style={styles.unitContainer}>
                <Button
                  variant={unit === 'mg' ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setUnit('mg')}
                  style={styles.unitButton}
                >
                  mg
                </Button>
                <Button
                  variant={unit === 'g' ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setUnit('g')}
                  style={styles.unitButton}
                >
                  g
                </Button>
                <Button
                  variant={unit === 'IU' ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setUnit('IU')}
                  style={styles.unitButton}
                >
                  IU
                </Button>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text variant="caption">Notes (Optional)</Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this supplement"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </View>

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={loading}
            disabled={!name.trim() || loading}
            style={styles.submitButton}
          >
            Add Supplement
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  formCard: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  input: {
    marginTop: spacing.xs,
  },
  dosageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dosageInput: {
    flex: 1,
  },
  unitContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  unitButton: {
    minWidth: 60,
  },
  submitButton: {
    marginTop: spacing.md,
  },
}); 