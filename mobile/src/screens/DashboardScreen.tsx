import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationCard, Card, CardHeader, CardTitle, CardContent } from '@/components';
import type { MainTabScreenProps } from '@/types/navigation';

// Simple icon components using emoji
const ChatIcon = () => <Text className="text-2xl">💬</Text>;
const SupplementIcon = () => <Text className="text-2xl">💊</Text>;
const LabIcon = () => <Text className="text-2xl">🧪</Text>;
const StatsIcon = () => <Text className="text-2xl">📊</Text>;

export default function DashboardScreen({ navigation }: MainTabScreenProps<'Dashboard'>) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </Text>
          <Text className="text-gray-600">
            Here's your health overview for today
          </Text>
        </View>

        {/* Quick Stats Summary */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-900">3/5</Text>
                <Text className="text-sm text-blue-700">Supplements</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-900">7.2h</Text>
                <Text className="text-sm text-blue-700">Sleep</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-900">8.2k</Text>
                <Text className="text-sm text-blue-700">Steps</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          
          <NavigationCard
            title="Chat with AI"
            description="Ask questions about your health data and get personalized insights"
            icon={<ChatIcon />}
            color="blue"
            onPress={() => navigation.navigate('Chat')}
          />

          <NavigationCard
            title="Log Supplements"
            description="Track your daily supplement intake and manage your routine"
            icon={<SupplementIcon />}
            color="green"
            onPress={() => navigation.navigate('Supplements')}
          />

          <NavigationCard
            title="Upload Labs"
            description="Upload and analyze your lab results for biomarker tracking"
            icon={<LabIcon />}
            color="purple"
            onPress={() => navigation.navigate('Labs')}
          />

          <NavigationCard
            title="Health Stats"
            description="View detailed analytics and trends in your health metrics"
            icon={<StatsIcon />}
            color="orange"
            onPress={() => navigation.navigate('HealthStats')}
          />
        </View>

        {/* Recent Activity */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              <View className="flex-row items-center py-2 border-b border-gray-100">
                <Text className="text-2xl mr-3">💊</Text>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Vitamin D3 logged</Text>
                  <Text className="text-sm text-gray-600">2 hours ago</Text>
                </View>
              </View>
              <View className="flex-row items-center py-2 border-b border-gray-100">
                <Text className="text-2xl mr-3">🧪</Text>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Lab results uploaded</Text>
                  <Text className="text-sm text-gray-600">Yesterday</Text>
                </View>
              </View>
              <View className="flex-row items-center py-2">
                <Text className="text-2xl mr-3">💬</Text>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Asked about sleep quality</Text>
                  <Text className="text-sm text-gray-600">2 days ago</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}