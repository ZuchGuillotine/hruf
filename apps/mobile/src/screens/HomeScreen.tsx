/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 27/05/2025 - 01:01:12
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 27/05/2025
    * - Author          : 
    * - Modification    : 
**/
import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Card, Text, Button } from '@stacktracker/mobile-ui';
import { colors, spacing, typography } from '@stacktracker/mobile-ui';
import { RootState } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export function HomeScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = React.useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="h1">Welcome{user?.name ? `, ${user.name}` : ''}</Text>
        <Text variant="subtitle" style={styles.subtitle}>
          Track your supplements and biomarkers
        </Text>
      </View>

      <View style={styles.actions}>
        <Card
          variant="elevated"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AddSupplement')}
        >
          <Text variant="subtitle">Add Supplement</Text>
          <Text variant="caption" style={styles.actionDescription}>
            Log a new supplement intake
          </Text>
        </Card>

        <Card
          variant="elevated"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AddBiomarker')}
        >
          <Text variant="subtitle">Add Biomarker</Text>
          <Text variant="caption" style={styles.actionDescription}>
            Record a new biomarker reading
          </Text>
        </Card>

        <Card
          variant="elevated"
          style={styles.actionCard}
          onPress={() => navigation.navigate('Supplements')}
        >
          <Text variant="subtitle">View Supplements</Text>
          <Text variant="caption" style={styles.actionDescription}>
            See your supplement history
          </Text>
        </Card>

        <Card
          variant="elevated"
          style={styles.actionCard}
          onPress={() => navigation.navigate('Biomarkers')}
        >
          <Text variant="subtitle">View Biomarkers</Text>
          <Text variant="caption" style={styles.actionDescription}>
            Track your biomarker trends
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
  },
  actionCard: {
    padding: spacing.lg,
  },
  actionDescription: {
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
}); 