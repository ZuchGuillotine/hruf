import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components';
import type { MainTabScreenProps } from '@/types/navigation';

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  taken: boolean;
  timesTaken: number;
  totalTimes: number;
}

const mockSupplements: Supplement[] = [
  {
    id: '1',
    name: 'Vitamin D3',
    dosage: '2000 IU',
    frequency: 'Once daily',
    taken: false,
    timesTaken: 0,
    totalTimes: 1,
  },
  {
    id: '2',
    name: 'Omega-3',
    dosage: '1000mg',
    frequency: 'Twice daily',
    taken: false,
    timesTaken: 1,
    totalTimes: 2,
  },
  {
    id: '3',
    name: 'Magnesium',
    dosage: '400mg',
    frequency: 'Before bed',
    taken: true,
    timesTaken: 1,
    totalTimes: 1,
  },
];

export default function SupplementsScreen({ navigation }: MainTabScreenProps<'Supplements'>) {
  const [supplements, setSupplements] = useState(mockSupplements);

  const toggleSupplement = (id: string) => {
    setSupplements(prev => prev.map(supplement => {
      if (supplement.id === id) {
        const newTimesTaken = supplement.taken ? 
          Math.max(0, supplement.timesTaken - 1) : 
          Math.min(supplement.totalTimes, supplement.timesTaken + 1);
        
        return {
          ...supplement,
          taken: newTimesTaken === supplement.totalTimes,
          timesTaken: newTimesTaken,
        };
      }
      return supplement;
    }));
  };

  const completedCount = supplements.filter(s => s.taken).length;
  const totalCount = supplements.length;

  const renderSupplement = (supplement: Supplement) => {
    const progress = supplement.timesTaken / supplement.totalTimes;
    const isCompleted = supplement.taken;

    return (
      <Card key={supplement.id} className="mb-4">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                {supplement.name}
              </Text>
              <Text className="text-sm text-gray-600 mb-1">
                {supplement.dosage} • {supplement.frequency}
              </Text>
              <Text className="text-xs text-gray-500">
                {supplement.timesTaken}/{supplement.totalTimes} taken today
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl mb-2">
                {isCompleted ? '✅' : '⏰'}
              </Text>
            </View>
          </View>
          
          {/* Progress bar */}
          <View className="bg-gray-200 rounded-full h-2 mb-3">
            <View 
              className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress * 100}%` }}
            />
          </View>

          <Button
            onPress={() => toggleSupplement(supplement.id)}
            variant={isCompleted ? 'secondary' : 'default'}
            size="sm"
          >
            {isCompleted ? 'Undo' : 'Mark as Taken'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            My Supplements
          </Text>
          <Text className="text-gray-600">
            Track your daily supplement intake
          </Text>
        </View>

        {/* Progress Summary */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-green-900">
                  {completedCount}/{totalCount}
                </Text>
                <Text className="text-sm text-green-700">
                  Supplements completed
                </Text>
              </View>
              <View className="bg-green-100 rounded-full w-16 h-16 items-center justify-center">
                <Text className="text-2xl">
                  {completedCount === totalCount ? '🎉' : '💊'}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Supplements List */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Today's Supplements
          </Text>
          {supplements.map(renderSupplement)}
        </View>

        {/* Add Button */}
        <Button
          onPress={() => {
            // In a real app, this would navigate to add supplement screen
            console.log('Navigate to add supplement');
          }}
          variant="secondary"
          className="mb-6"
        >
          + Add New Supplement
        </Button>
        
        {/* Weekly Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-600 mb-3">
              Your supplement consistency this week
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Compliance Rate</Text>
              <Text className="text-sm font-medium text-gray-900">85%</Text>
            </View>
            <View className="bg-gray-200 rounded-full h-2">
              <View className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}