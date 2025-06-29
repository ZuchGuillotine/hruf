import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

interface HealthMetric {
  id: string;
  title: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  color: 'green' | 'red' | 'blue' | 'orange';
}

const mockHealthStats: HealthMetric[] = [
  {
    id: '1',
    title: 'Weight',
    value: '165.2',
    unit: 'lbs',
    trend: 'down',
    trendPercentage: 2.1,
    color: 'green',
  },
  {
    id: '2',
    title: 'Body Fat',
    value: '18.5',
    unit: '%',
    trend: 'down',
    trendPercentage: 1.3,
    color: 'green',
  },
  {
    id: '3',
    title: 'Sleep',
    value: '7.2',
    unit: 'hours',
    trend: 'up',
    trendPercentage: 8.5,
    color: 'blue',
  },
  {
    id: '4',
    title: 'Steps',
    value: '8,245',
    unit: 'steps',
    trend: 'stable',
    color: 'orange',
  },
];

export default function HealthStatsScreen({ navigation }: RootStackScreenProps<'HealthStats'>) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', metricColor: string) => {
    if (trend === 'stable') return 'text-gray-600';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const renderHealthMetric = (metric: HealthMetric) => (
    <Card key={metric.id} className="mb-4">
      <CardContent className="p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-600 mb-1">{metric.title}</Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-bold text-gray-900">
                {metric.value}
              </Text>
              <Text className="text-sm text-gray-600 ml-1">
                {metric.unit}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-lg">{getTrendIcon(metric.trend)}</Text>
            {metric.trendPercentage && (
              <Text className={`text-sm font-medium ${getTrendColor(metric.trend, metric.color)}`}>
                {metric.trend === 'up' ? '+' : '-'}{metric.trendPercentage}%
              </Text>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3"
          >
            <Text className="text-blue-600 text-lg">← Back</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-semibold text-gray-900">
              Health Stats
            </Text>
            <Text className="text-sm text-gray-600">
              Your health metrics overview
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-blue-800 mb-2">
              You're making great progress this week! 📈
            </Text>
            <Text className="text-blue-700 text-sm">
              • Weight trending down 2.1%
            </Text>
            <Text className="text-blue-700 text-sm">
              • Sleep improved by 8.5%
            </Text>
            <Text className="text-blue-700 text-sm">
              • Maintained consistent activity levels
            </Text>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Current Metrics
          </Text>
          {mockHealthStats.map(renderHealthMetric)}
        </View>

        {/* Recent Updates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <View>
                  <Text className="font-medium text-gray-900">Weight</Text>
                  <Text className="text-sm text-gray-600">2 hours ago</Text>
                </View>
                <Text className="text-gray-900">165.2 lbs</Text>
              </View>
              <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                <View>
                  <Text className="font-medium text-gray-900">Sleep</Text>
                  <Text className="text-sm text-gray-600">This morning</Text>
                </View>
                <Text className="text-gray-900">7h 12m</Text>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <View>
                  <Text className="font-medium text-gray-900">Steps</Text>
                  <Text className="text-sm text-gray-600">Yesterday</Text>
                </View>
                <Text className="text-gray-900">8,245</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Action Button */}
        <TouchableOpacity className="bg-blue-600 rounded-lg p-4 items-center mb-6">
          <Text className="text-white font-semibold text-lg">
            Add New Measurement
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}