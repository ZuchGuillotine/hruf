import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components';
import type { MainTabScreenProps } from '@/types/navigation';

interface LabResult {
  id: string;
  name: string;
  date: string;
  biomarkerCount: number;
  status: 'processing' | 'completed' | 'failed';
  summary?: string;
}

interface Biomarker {
  id: string;
  name: string;
  value: string;
  unit: string;
  range: string;
  status: 'normal' | 'low' | 'high';
  date: string;
}

const mockLabResults: LabResult[] = [
  {
    id: '1',
    name: 'Complete Blood Panel',
    date: '2024-03-15',
    biomarkerCount: 12,
    status: 'completed',
    summary: 'All values within normal range. Vitamin D slightly low.',
  },
  {
    id: '2',
    name: 'Lipid Panel',
    date: '2024-02-28',
    biomarkerCount: 5,
    status: 'completed',
    summary: 'LDL cholesterol elevated. HDL within normal range.',
  },
  {
    id: '3',
    name: 'Hormone Panel',
    date: '2024-03-20',
    biomarkerCount: 8,
    status: 'processing',
  },
];

const mockBiomarkers: Biomarker[] = [
  {
    id: '1',
    name: 'Vitamin D',
    value: '42',
    unit: 'ng/mL',
    range: '30-100',
    status: 'normal',
    date: '2024-03-15',
  },
  {
    id: '2',
    name: 'B12',
    value: '285',
    unit: 'pg/mL',
    range: '300-900',
    status: 'low',
    date: '2024-03-15',
  },
  {
    id: '3',
    name: 'Iron',
    value: '95',
    unit: 'μg/dL',
    range: '60-150',
    status: 'normal',
    date: '2024-03-15',
  },
];

export default function LabsScreen({ navigation }: MainTabScreenProps<'Labs'>) {
  const [labResults, setLabResults] = useState(mockLabResults);
  const [biomarkers, setBiomarkers] = useState(mockBiomarkers);

  const handleUpload = () => {
    Alert.alert(
      'Upload Lab Results',
      'Choose how you want to upload your lab results:',
      [
        { text: 'Take Photo', onPress: () => console.log('Open camera') },
        { text: 'Choose from Files', onPress: () => console.log('Open file picker') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getBiomarkerStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'low':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBiomarkerIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return '✅';
      case 'low':
        return '⬇️';
      case 'high':
        return '⬆️';
      default:
        return '📊';
    }
  };

  const renderBiomarker = (biomarker: Biomarker) => (
    <Card key={biomarker.id} className="mb-4">
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold text-gray-900">
            {biomarker.name}
          </Text>
          <Text className="text-2xl">
            {getBiomarkerIcon(biomarker.status)}
          </Text>
        </View>
        
        <View className="flex-row items-baseline justify-between mb-2">
          <Text className={`text-2xl font-bold ${getBiomarkerStatusColor(biomarker.status)}`}>
            {biomarker.value} {biomarker.unit}
          </Text>
          <Text className="text-sm text-gray-600">
            {new Date(biomarker.date).toLocaleDateString()}
          </Text>
        </View>
        
        <Text className="text-sm text-gray-600">
          Normal range: {biomarker.range} {biomarker.unit}
        </Text>
      </CardContent>
    </Card>
  );

  const normalCount = biomarkers.filter(b => b.status === 'normal').length;
  const abnormalCount = biomarkers.length - normalCount;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Lab Results
          </Text>
          <Text className="text-gray-600">
            Upload and track your biomarker data
          </Text>
        </View>

        {/* Upload Section */}
        <TouchableOpacity
          onPress={handleUpload}
          className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6 items-center"
        >
          <Text className="text-4xl mb-3">📋</Text>
          <Text className="text-xl font-semibold text-blue-900 mb-2">
            Upload Lab Results
          </Text>
          <Text className="text-blue-700 text-center">
            Take a photo or select from your files{'\n'}
            AI will automatically extract biomarker data
          </Text>
        </TouchableOpacity>

        {/* Biomarker Summary */}
        <Card className="mb-6 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Biomarker Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-900">{normalCount}</Text>
                <Text className="text-sm text-purple-700">Normal</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-900">{abnormalCount}</Text>
                <Text className="text-sm text-purple-700">Need Attention</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-900">{biomarkers.length}</Text>
                <Text className="text-sm text-purple-700">Total Tracked</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Recent Biomarkers */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Biomarkers
          </Text>
          {biomarkers.map(renderBiomarker)}
        </View>

        {/* View History Button */}
        <Button
          onPress={() => console.log('View full history')}
          variant="outline"
          className="mb-6"
        >
          View Full History
        </Button>

        {/* Insights Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-600 mb-3">
              Based on your recent biomarkers:
            </Text>
            <View className="space-y-2">
              <Text className="text-sm text-gray-700">
                • Your B12 levels are below optimal range - consider supplementation
              </Text>
              <Text className="text-sm text-gray-700">
                • Vitamin D and Iron levels are within healthy ranges
              </Text>
              <Text className="text-sm text-gray-700">
                • Schedule follow-up testing in 3 months
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  uploadButton: {},
  uploadButtonText: {},
  section: {
    marginBottom: 24,
  },
  sectionTitle: {},
  card: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {},
  cardDate: {},
  cardContent: {},
  biomarkerValue: {
    marginBottom: 4,
  },
  biomarkerRange: {},
  viewHistoryButton: {},
  viewHistoryButtonText: {},
});