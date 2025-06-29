import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, Button } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen({ navigation }: RootStackScreenProps<'Chat'>) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. I can help you with questions about your supplements, health data, and wellness goals. What would you like to know?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I understand your question. This is a placeholder response. In the full implementation, I would analyze your health data and provide personalized insights.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <Card className={`max-w-4/5 ${
        message.isUser 
          ? 'bg-blue-600 border-blue-600' 
          : 'bg-white border-gray-200'
      }`}>
        <CardContent className="p-3">
          <Text className={`${
            message.isUser ? 'text-white' : 'text-gray-900'
          }`}>
            {message.text}
          </Text>
          <Text className={`text-xs mt-1 ${
            message.isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </CardContent>
      </Card>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
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
                AI Health Assistant
              </Text>
              <Text className="text-sm text-gray-600">
                Ask me about your health data
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View className="items-start mb-4">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-3">
                  <Text className="text-gray-500">AI is thinking...</Text>
                </CardContent>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-end space-x-3">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your health..."
              multiline
              maxLength={500}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 max-h-24 bg-white text-gray-900"
              style={{ textAlignVertical: 'top' }}
            />
            <Button
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              size="sm"
              className="px-4 py-2"
            >
              Send
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}